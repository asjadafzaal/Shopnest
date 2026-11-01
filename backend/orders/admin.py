"""
Django Admin configuration for Cart, Order, SellerOrder, and OrderItem models.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse

from .models import Cart, CartItem, Order, SellerOrder, OrderItem


# ---------------------------------------------------------------------------
# Cart Admin
# ---------------------------------------------------------------------------

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ("product", "quantity", "line_total_display", "is_available_display", "updated_at")
    readonly_fields = ("line_total_display", "is_available_display", "updated_at")

    @admin.display(description="Line Total ($)")
    def line_total_display(self, obj):
        return f"${obj.line_total}"

    @admin.display(description="In Stock?", boolean=True)
    def is_available_display(self, obj):
        return obj.is_available


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "items_count", "cart_total_display", "updated_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("created_at", "updated_at", "cart_total_display")
    inlines = [CartItemInline]

    @admin.display(description="Items Count")
    def items_count(self, obj):
        return obj.total_items

    @admin.display(description="Cart Total ($)")
    def cart_total_display(self, obj):
        return f"${obj.total_price}"


# ---------------------------------------------------------------------------
# Order Admin
# ---------------------------------------------------------------------------

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ("product_name", "price", "quantity", "line_total", "product")
    readonly_fields = ("product_name", "price", "quantity", "line_total", "product")
    can_delete = False


class SellerOrderInline(admin.StackedInline):
    model = SellerOrder
    extra = 0
    fields = ("store", "subtotal", "status", "tracking_number", "notes")
    readonly_fields = ("store", "subtotal")
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """
    Administration view for full customer orders.
    Shows seller sub-orders as inlines with fulfillment tracking.
    """

    list_display = (
        "order_number",
        "user",
        "total_amount",
        "status",
        "payment_status",
        "seller_orders_count",
        "created_at",
    )
    list_filter = (
        "status",
        "payment_status",
        "created_at",
    )
    search_fields = (
        "order_number",
        "user__username",
        "user__email",
        "shipping_full_name",
        "shipping_phone",
    )
    readonly_fields = ("order_number", "total_amount", "created_at", "updated_at")
    inlines = [SellerOrderInline]

    fieldsets = (
        (
            "Order Overview",
            {
                "fields": ("order_number", "user", "total_amount", "status", "payment_status", "payment_method"),
            },
        ),
        (
            "Shipping Address",
            {
                "fields": (
                    "shipping_full_name",
                    "shipping_phone",
                    "shipping_address",
                    "shipping_city",
                    "shipping_state",
                    "shipping_postal_code",
                    "shipping_country",
                ),
            },
        ),
        (
            "Timestamps",
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    @admin.display(description="Sellers Count")
    def seller_orders_count(self, obj):
        return obj.seller_orders.count()


@admin.register(SellerOrder)
class SellerOrderAdmin(admin.ModelAdmin):
    """
    Administration view for individual seller portions of an order.
    """

    list_display = (
        "id",
        "order_link",
        "store",
        "subtotal",
        "status",
        "tracking_number",
        "created_at",
    )
    list_filter = (
        "status",
        "store",
        "created_at",
    )
    search_fields = (
        "order__order_number",
        "store__name",
        "tracking_number",
        "order__user__username",
    )
    readonly_fields = ("order", "store", "subtotal", "created_at", "updated_at")
    inlines = [OrderItemInline]

    @admin.display(description="Parent Order")
    def order_link(self, obj):
        url = reverse("admin:orders_order_change", args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, obj.order.order_number)
