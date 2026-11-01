"""
Order, SellerOrder, OrderItem, Cart, and CartItem models for the ShopNest marketplace.

Implements multi-vendor order routing:
- Customer creates an overall `Order`.
- The order is automatically split into `SellerOrder` records per seller store.
- Each item purchased is snapshotted as an `OrderItem` preserving price and product name.
"""

import uuid
from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from catalog.models import Product
from sellers.models import Store


# ---------------------------------------------------------------------------
# Cart Models
# ---------------------------------------------------------------------------

class Cart(models.Model):
    """
    Shopping cart associated with a customer.
    One active cart per registered user.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"Cart of {self.user.username}"

    @property
    def total_items(self):
        """Total number of individual item units in the cart."""
        return sum(item.quantity for item in self.items.all())

    @property
    def total_price(self):
        """
        Total calculated price of all valid items in the cart.
        Calculated dynamically from current product prices.
        """
        total = sum(item.line_total for item in self.items.select_related("product"))
        return Decimal(str(round(total, 2)))

    @property
    def is_empty(self):
        return not self.items.exists()

    def clear(self):
        """Remove all items from this cart."""
        self.items.all().delete()


class CartItem(models.Model):
    """
    An individual product line in a customer's cart.
    Multi-vendor: Items can belong to different seller stores.
    """

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Quantity of this product in cart (minimum 1).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"],
                name="unique_product_per_cart",
            )
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in cart {self.cart.id}"

    @property
    def line_total(self):
        """Calculate line item total using the current product price."""
        return Decimal(str(round(self.quantity * self.product.price, 2)))

    @property
    def is_available(self):
        """Checks if product is still active and has sufficient stock."""
        return (
            self.product.is_active
            and self.product.store.is_active
            and self.product.store.seller_profile.is_approved
            and self.product.stock >= self.quantity
        )


# ---------------------------------------------------------------------------
# Order Models (Multi-Vendor Split Architecture)
# ---------------------------------------------------------------------------

def generate_order_number():
    """Generates a human-friendly unique order reference code like SN-20261030-A1B2."""
    date_str = timezone.now().strftime("%Y%m%d")
    random_code = uuid.uuid4().hex[:6].upper()
    return f"SN-{date_str}-{random_code}"


class Order(models.Model):
    """
    Customer's overall order encompassing items from one or more seller stores.
    Contains customer details, shipping address, and total order payment status.
    """

    class OrderStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"
        REFUNDED = "refunded", "Refunded"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
        help_text="Customer who placed the order.",
    )
    order_number = models.CharField(
        max_length=40,
        unique=True,
        default=generate_order_number,
        editable=False,
        db_index=True,
        help_text="Unique customer order reference identifier.",
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Overall order total calculated by the backend.",
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PROCESSING,
        db_index=True,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PAID,
        db_index=True,
    )
    payment_method = models.CharField(
        max_length=50,
        default="card_simulation",
        help_text="Simulated payment method identifier.",
    )

    # Shipping Address Details
    shipping_full_name = models.CharField(max_length=150)
    shipping_phone = models.CharField(max_length=30)
    shipping_address = models.TextField(help_text="Street address including apartment/unit.")
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default="United States")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Customer Order"
        verbose_name_plural = "Customer Orders"
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(total_amount__gte=0),
                name="check_order_non_negative_total",
            ),
        ]

    def __str__(self):
        return f"Order {self.order_number} (${self.total_amount})"

    @property
    def total_items_count(self):
        """Sum of all quantities across all seller orders."""
        return sum(so.total_items_count for so in self.seller_orders.all())


class SellerOrder(models.Model):
    """
    Sub-order assigned to a specific seller's store.
    Sellers manage fulfillment (processing, shipping, delivery) of their own portion.
    """

    class FulfillmentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="seller_orders",
        help_text="Parent customer order.",
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.PROTECT,
        related_name="seller_orders",
        help_text="Seller store responsible for fulfilling this sub-order.",
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Subtotal for this seller's products only.",
    )
    status = models.CharField(
        max_length=20,
        choices=FulfillmentStatus.choices,
        default=FulfillmentStatus.PENDING,
        db_index=True,
    )
    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="Shipment tracking code provided by the seller.",
    )
    notes = models.TextField(
        blank=True,
        help_text="Seller internal or customer fulfillment notes.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Seller Sub-Order"
        verbose_name_plural = "Seller Sub-Orders"
        indexes = [
            models.Index(fields=["store", "status"]),
            models.Index(fields=["order", "store"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(subtotal__gte=0),
                name="check_seller_order_non_negative_subtotal",
            ),
        ]

    def __str__(self):
        return f"{self.store.name} sub-order for {self.order.order_number}"

    @property
    def total_items_count(self):
        return sum(item.quantity for item in self.items.all())


class OrderItem(models.Model):
    """
    Historical snapshot of an item purchased within a seller sub-order.
    Preserves exact price, product name, and quantity at purchase time.
    """

    seller_order = models.ForeignKey(
        SellerOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
        help_text="Product reference (kept even if product details change later).",
    )
    product_name = models.CharField(
        max_length=300,
        help_text="Snapshotted product name at time of purchase.",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Snapshotted unit price at time of purchase.",
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Quantity purchased.",
    )
    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Line total calculated at checkout (price * quantity).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gte=1),
                name="check_order_item_positive_quantity",
            ),
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name="check_order_item_positive_price",
            ),
            models.CheckConstraint(
                check=models.Q(line_total__gt=0),
                name="check_order_item_positive_line_total",
            ),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product_name} (${self.line_total})"
