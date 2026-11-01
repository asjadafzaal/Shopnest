"""
Serializers for Cart, CartItem, Order, SellerOrder, and OrderItem APIs.
"""

from rest_framework import serializers
from catalog.models import Product
from .models import Cart, CartItem, Order, SellerOrder, OrderItem


# ---------------------------------------------------------------------------
# Cart Serializers
# ---------------------------------------------------------------------------

class CartItemSerializer(serializers.ModelSerializer):
    """
    Detailed read serializer for items inside a customer's cart.
    Includes current live product data, store information, and stock warnings.
    """

    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    store_name = serializers.CharField(source="product.store.name", read_only=True)
    store_slug = serializers.CharField(source="product.store.slug", read_only=True)
    unit_price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_available = serializers.IntegerField(source="product.stock", read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "product_id",
            "product_name",
            "product_slug",
            "store_name",
            "store_slug",
            "unit_price",
            "quantity",
            "line_total",
            "stock_available",
            "is_available",
            "image",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_image(self, obj):
        primary_img = obj.product.images.filter(is_primary=True).first() or obj.product.images.first()
        if primary_img and primary_img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary_img.image.url)
            return primary_img.image.url
        return None


class CartSerializer(serializers.ModelSerializer):
    """
    Representation of the customer's full cart with computed totals.
    """

    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    total_price = serializers.ReadOnlyField()
    is_empty = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "items",
            "total_items",
            "total_price",
            "is_empty",
            "updated_at",
        )
        read_only_fields = fields


class AddToCartSerializer(serializers.Serializer):
    """
    Validates adding an item to the cart, including product activity
    and live stock availability checks.
    """

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.select_related("store__seller_profile").get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product does not exist.")

        if not product.is_active:
            raise serializers.ValidationError("This product is no longer active.")

        if not product.store.is_active or not product.store.seller_profile.is_approved:
            raise serializers.ValidationError("This store is currently not active.")

        if product.stock <= 0:
            raise serializers.ValidationError("This product is currently out of stock.")

        return value

    def validate(self, attrs):
        product = Product.objects.get(id=attrs["product_id"])
        requested_qty = attrs["quantity"]

        cart = self.context.get("cart")
        if cart:
            existing_item = cart.items.filter(product=product).first()
            current_cart_qty = existing_item.quantity if existing_item else 0
            total_target_qty = current_cart_qty + requested_qty
            if total_target_qty > product.stock:
                raise serializers.ValidationError(
                    f"Cannot add {requested_qty} more item(s). Only {product.stock} available in stock (you have {current_cart_qty} already in your cart)."
                )
        else:
            if requested_qty > product.stock:
                raise serializers.ValidationError(
                    f"Only {product.stock} unit(s) available in stock."
                )

        attrs["product"] = product
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    """
    Validates updating quantity of an existing item in the cart.
    """

    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        cart_item = self.context.get("cart_item")
        if not cart_item:
            return value

        product = cart_item.product
        if not product.is_active:
            raise serializers.ValidationError("This product is no longer active.")

        if value > product.stock:
            raise serializers.ValidationError(
                f"Requested quantity {value} exceeds available stock of {product.stock}."
            )
        return value


# ---------------------------------------------------------------------------
# Order Serializers
# ---------------------------------------------------------------------------

class OrderItemSerializer(serializers.ModelSerializer):
    """
    Snapshot of an individual purchased item.
    """

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "price",
            "quantity",
            "line_total",
        )
        read_only_fields = fields


class SellerOrderSerializer(serializers.ModelSerializer):
    """
    Serializer for the seller-specific sub-order portion.
    """

    store_name = serializers.CharField(source="store.name", read_only=True)
    store_slug = serializers.CharField(source="store.slug", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    total_items_count = serializers.ReadOnlyField()

    class Meta:
        model = SellerOrder
        fields = (
            "id",
            "store_name",
            "store_slug",
            "subtotal",
            "status",
            "tracking_number",
            "notes",
            "items",
            "total_items_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive order details for customer viewing.
    Contains overall order data, shipping address, and seller sub-orders.
    """

    seller_orders = SellerOrderSerializer(many=True, read_only=True)
    total_items_count = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "total_amount",
            "status",
            "payment_status",
            "payment_method",
            "total_items_count",
            "shipping_full_name",
            "shipping_phone",
            "shipping_address",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "seller_orders",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderListSerializer(serializers.ModelSerializer):
    """
    Summary view of an order for customer order history lists.
    """

    stores = serializers.SerializerMethodField()
    total_items_count = serializers.ReadOnlyField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "total_amount",
            "status",
            "payment_status",
            "total_items_count",
            "stores",
            "created_at",
        )
        read_only_fields = fields

    def get_stores(self, obj):
        return [so.store.name for so in obj.seller_orders.select_related("store")]


class SellerOrderFulfillmentSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for sellers to inspect and manage fulfillment of their orders.
    Allows updating status, tracking_number, and notes.
    """

    order_number = serializers.CharField(source="order.order_number", read_only=True)
    customer_username = serializers.CharField(source="order.user.username", read_only=True)
    customer_email = serializers.CharField(source="order.user.email", read_only=True)
    shipping_full_name = serializers.CharField(source="order.shipping_full_name", read_only=True)
    shipping_phone = serializers.CharField(source="order.shipping_phone", read_only=True)
    shipping_address = serializers.CharField(source="order.shipping_address", read_only=True)
    shipping_city = serializers.CharField(source="order.shipping_city", read_only=True)
    shipping_state = serializers.CharField(source="order.shipping_state", read_only=True)
    shipping_postal_code = serializers.CharField(source="order.shipping_postal_code", read_only=True)
    shipping_country = serializers.CharField(source="order.shipping_country", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = SellerOrder
        fields = (
            "id",
            "order_number",
            "customer_username",
            "customer_email",
            "subtotal",
            "status",
            "tracking_number",
            "notes",
            "shipping_full_name",
            "shipping_phone",
            "shipping_address",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "order_number",
            "customer_username",
            "customer_email",
            "subtotal",
            "shipping_full_name",
            "shipping_phone",
            "shipping_address",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "items",
            "created_at",
            "updated_at",
        )


class CheckoutSerializer(serializers.Serializer):
    """
    Validates shipping address and payment simulation data during checkout.
    """

    shipping_full_name = serializers.CharField(max_length=150, required=True)
    shipping_phone = serializers.CharField(max_length=30, required=True)
    shipping_address = serializers.CharField(required=True)
    shipping_city = serializers.CharField(max_length=100, required=True)
    shipping_state = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    shipping_postal_code = serializers.CharField(max_length=20, required=True)
    shipping_country = serializers.CharField(max_length=100, required=False, default="United States")
    payment_method = serializers.CharField(max_length=50, required=False, default="card_simulation")
