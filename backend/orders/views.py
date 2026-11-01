"""
Views for Cart, Checkout, Customer Orders, and Seller Fulfillment.
"""

from collections import defaultdict
from decimal import Decimal
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied

from catalog.models import Product
from sellers.permissions import IsSeller
from .models import Cart, CartItem, Order, SellerOrder, OrderItem
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    SellerOrderFulfillmentSerializer,
)


def get_or_create_cart_for_user(user):
    """Helper to retrieve or lazily create a cart for the authenticated user."""
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


# ---------------------------------------------------------------------------
# Cart Views
# ---------------------------------------------------------------------------

class CartDetailView(generics.RetrieveAPIView):
    """
    Retrieve the current customer's shopping cart.
    Returns calculated totals, line items, and real-time stock status.
    """

    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_or_create_cart_for_user(self.request.user)


class AddToCartView(APIView):
    """
    Add a product to the customer's cart.
    Validates product active status and available stock.
    If the product already exists in the cart, increments the quantity.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        cart = get_or_create_cart_for_user(request.user)
        serializer = AddToCartSerializer(data=request.data, context={"cart": cart, "request": request})
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data["product"]
        quantity = serializer.validated_data["quantity"]

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not created:
            cart_item.quantity += quantity
            cart_item.save(update_fields=["quantity", "updated_at"])

        return Response(
            {
                "message": f"Added {product.name} to cart.",
                "cart": CartSerializer(cart, context={"request": request}).data,
            },
            status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED,
        )


class CartItemUpdateDeleteView(APIView):
    """
    Update quantity or remove a specific item from the customer's cart.
    PATCH/PUT: Update quantity (with stock check).
    DELETE: Remove item.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_cart_item(self, request, item_id):
        cart = get_or_create_cart_for_user(request.user)
        try:
            return CartItem.objects.select_related("product").get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            raise NotFound("Item not found in your cart.")

    def patch(self, request, item_id, *args, **kwargs):
        cart_item = self.get_cart_item(request, item_id)
        serializer = UpdateCartItemSerializer(
            data=request.data,
            context={"cart_item": cart_item, "request": request},
        )
        serializer.is_valid(raise_exception=True)

        cart_item.quantity = serializer.validated_data["quantity"]
        cart_item.save(update_fields=["quantity", "updated_at"])

        cart = cart_item.cart
        return Response(
            {
                "message": "Cart item updated successfully.",
                "cart": CartSerializer(cart, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, item_id, *args, **kwargs):
        cart_item = self.get_cart_item(request, item_id)
        cart = cart_item.cart
        product_name = cart_item.product.name
        cart_item.delete()

        return Response(
            {
                "message": f"Removed {product_name} from cart.",
                "cart": CartSerializer(cart, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


class ClearCartView(APIView):
    """
    Remove all items from the customer's cart.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        cart = get_or_create_cart_for_user(request.user)
        cart.clear()
        return Response(
            {
                "message": "Cart cleared.",
                "cart": CartSerializer(cart, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Checkout View (transaction.atomic + select_for_update)
# ---------------------------------------------------------------------------

class CheckoutView(APIView):
    """
    Execute multi-vendor checkout.

    Guarantees:
    - Wrapped in database transaction `transaction.atomic()`.
    - Locks affected products with `select_for_update()` to prevent race condition stock overselling.
    - Decrements stock in database.
    - Creates parent `Order` and splits items into `SellerOrder` per store.
    - Snapshots unit price and product name in `OrderItem`.
    - Clears active cart on success.
    """

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shipping_data = serializer.validated_data

        cart = get_or_create_cart_for_user(request.user)
        cart_items = list(cart.items.select_related("product__store__seller_profile").all())

        if not cart_items:
            raise ValidationError("Your cart is empty. Add items before checking out.")

        # Collect product IDs and acquire pessimistic row locks to prevent concurrent race conditions
        product_ids = [item.product_id for item in cart_items]
        locked_products = {
            p.id: p
            for p in Product.objects.select_for_update().filter(id__in=product_ids)
        }

        # Validate live stock and availability under lock
        for item in cart_items:
            product = locked_products.get(item.product_id)
            if not product:
                raise ValidationError(f"Product '{item.product.name}' is no longer available.")

            if not product.is_active:
                raise ValidationError(f"Product '{product.name}' is no longer active.")

            store = product.store
            if not store.is_active or not store.seller_profile.is_approved:
                raise ValidationError(f"Store '{store.name}' is currently unavailable.")

            if product.stock < item.quantity:
                raise ValidationError(
                    f"Insufficient stock for '{product.name}'. Requested: {item.quantity}, available: {product.stock}."
                )

        # Create overall customer Order
        order = Order.objects.create(
            user=request.user,
            total_amount=Decimal("0.00"),  # Will update after calculating seller sub-orders
            status=Order.OrderStatus.PROCESSING,
            payment_status=Order.PaymentStatus.PAID,
            payment_method=shipping_data.get("payment_method", "card_simulation"),
            shipping_full_name=shipping_data["shipping_full_name"],
            shipping_phone=shipping_data["shipping_phone"],
            shipping_address=shipping_data["shipping_address"],
            shipping_city=shipping_data["shipping_city"],
            shipping_state=shipping_data.get("shipping_state", ""),
            shipping_postal_code=shipping_data["shipping_postal_code"],
            shipping_country=shipping_data.get("shipping_country", "United States"),
        )

        # Group items by store for multi-vendor sub-orders
        items_by_store = defaultdict(list)
        for item in cart_items:
            items_by_store[item.product.store].append(item)

        overall_total = Decimal("0.00")

        # Process each seller store
        for store, store_items in items_by_store.items():
            store_subtotal = Decimal("0.00")

            # First create the SellerOrder shell
            seller_order = SellerOrder.objects.create(
                order=order,
                store=store,
                subtotal=Decimal("0.00"),
                status=SellerOrder.FulfillmentStatus.PENDING,
            )

            # Create OrderItems and deduct inventory
            for item in store_items:
                product = locked_products[item.product_id]
                unit_price = product.price
                line_total = Decimal(str(round(unit_price * item.quantity, 2)))
                store_subtotal += line_total

                # Deduct stock safely
                product.stock -= item.quantity
                product.save(update_fields=["stock"])

                # Snapshot order item
                OrderItem.objects.create(
                    seller_order=seller_order,
                    product=product,
                    product_name=product.name,
                    price=unit_price,
                    quantity=item.quantity,
                    line_total=line_total,
                )

            seller_order.subtotal = store_subtotal
            seller_order.save(update_fields=["subtotal"])
            overall_total += store_subtotal

        # Set verified total on customer Order
        order.total_amount = overall_total
        order.save(update_fields=["total_amount"])

        # Clear cart upon successful transaction
        cart.clear()

        return Response(
            {
                "message": "Order placed successfully!",
                "order": OrderDetailSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Customer Order Views
# ---------------------------------------------------------------------------

class CustomerOrderListView(generics.ListAPIView):
    """
    List orders placed by the current authenticated customer.
    """

    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("seller_orders__store")
            .order_by("-created_at")
        )


class CustomerOrderDetailView(generics.RetrieveAPIView):
    """
    Retrieve details of a specific order belonging to the current customer.
    """

    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "id"

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("seller_orders__items", "seller_orders__store")
        )


# ---------------------------------------------------------------------------
# Seller Order Views (Fulfillment & Isolation)
# ---------------------------------------------------------------------------

class SellerOrderListView(generics.ListAPIView):
    """
    List seller sub-orders assigned to the authenticated seller's store.
    Strictly isolated: sellers can only see their own store's orders.
    Supports optional status filtering: `?status=pending`.
    """

    serializer_class = SellerOrderFulfillmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_queryset(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            return SellerOrder.objects.none()

        qs = (
            SellerOrder.objects.filter(store=profile.store)
            .select_related("order__user", "store")
            .prefetch_related("items")
            .order_by("-created_at")
        )

        filter_status = self.request.query_params.get("status")
        if filter_status:
            qs = qs.filter(status=filter_status)

        return qs


class SellerOrderDetailView(generics.RetrieveAPIView):
    """
    Retrieve full details of a specific seller sub-order (ownership enforced).
    """

    serializer_class = SellerOrderFulfillmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    lookup_field = "id"

    def get_queryset(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            return SellerOrder.objects.none()
        return (
            SellerOrder.objects.filter(store=profile.store)
            .select_related("order__user", "store")
            .prefetch_related("items")
        )


class SellerOrderStatusUpdateView(APIView):
    """
    Update fulfillment status, tracking number, or notes for a seller sub-order.
    Allowed statuses: 'pending', 'processing', 'shipped', 'delivered', 'cancelled'.
    """

    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def patch(self, request, id, *args, **kwargs):
        profile = getattr(request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            raise PermissionDenied("You do not have a store.")

        try:
            seller_order = (
                SellerOrder.objects.select_related("order__user", "store")
                .prefetch_related("items")
                .get(id=id, store=profile.store)
            )
        except SellerOrder.DoesNotExist:
            raise NotFound("Seller order not found.")

        data = request.data
        allowed_fields = ["status", "tracking_number", "notes"]
        updated_fields = []

        new_status = data.get("status")
        if new_status:
            valid_statuses = [s.value for s in SellerOrder.FulfillmentStatus]
            if new_status not in valid_statuses:
                raise ValidationError(f"Invalid status '{new_status}'. Allowed: {valid_statuses}")
            seller_order.status = new_status
            updated_fields.append("status")

        if "tracking_number" in data:
            seller_order.tracking_number = data["tracking_number"]
            updated_fields.append("tracking_number")

        if "notes" in data:
            seller_order.notes = data["notes"]
            updated_fields.append("notes")

        if updated_fields:
            updated_fields.append("updated_at")
            seller_order.save(update_fields=updated_fields)

        return Response(
            {
                "message": "Fulfillment status updated successfully.",
                "seller_order": SellerOrderFulfillmentSerializer(seller_order).data,
            },
            status=status.HTTP_200_OK,
        )
