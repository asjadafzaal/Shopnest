"""
URL configuration for the orders app (Cart, Checkout, Customer Orders, Seller Fulfillment).
"""

from django.urls import path
from . import views

app_name = "orders"

urlpatterns = [
    # Cart endpoints
    path("cart/", views.CartDetailView.as_view(), name="cart-detail"),
    path("cart/items/", views.AddToCartView.as_view(), name="cart-add-item"),
    path("cart/items/<int:item_id>/", views.CartItemUpdateDeleteView.as_view(), name="cart-item-detail"),
    path("cart/clear/", views.ClearCartView.as_view(), name="cart-clear"),

    # Checkout endpoint (transaction.atomic + select_for_update)
    path("orders/checkout/", views.CheckoutView.as_view(), name="checkout"),

    # Customer order history
    path("orders/", views.CustomerOrderListView.as_view(), name="customer-order-list"),
    path("orders/<int:id>/", views.CustomerOrderDetailView.as_view(), name="customer-order-detail"),

    # Seller fulfillment (isolated to seller's own store)
    path("orders/seller/", views.SellerOrderListView.as_view(), name="seller-order-list"),
    path("orders/seller/<int:id>/", views.SellerOrderDetailView.as_view(), name="seller-order-detail"),
    path("orders/seller/<int:id>/status/", views.SellerOrderStatusUpdateView.as_view(), name="seller-order-status-update"),
]
