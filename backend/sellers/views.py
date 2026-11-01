"""
Views for Seller profiles, Store endpoints, and Seller Analytics.
Demonstrates Django ORM aggregations, annotations, and statistics.
"""

from decimal import Decimal
from django.db.models import Sum, Count, Avg, Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import SellerProfile, Store
from .serializers import (
    SellerProfileSerializer,
    StoreSerializer,
    StoreDetailSerializer,
)
from .permissions import IsSeller, IsApprovedSeller, IsStoreOwner


class SellerProfileView(generics.GenericAPIView):
    """
    Manage the authenticated user's seller profile.
    GET: Retrieve seller profile.
    POST: Create seller profile if none exists.
    PUT/PATCH: Update seller profile.
    """

    serializer_class = SellerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if not profile:
            raise NotFound("Seller profile not found. Please create one.")
        return profile

    def get(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        if hasattr(request.user, "seller_profile"):
            return Response(
                {"detail": "Seller profile already exists for this account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Automatically update user role to seller if not already
        if request.user.role != "seller":
            request.user.role = "seller"
            request.user.save(update_fields=["role"])

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save(user=request.user)
        return Response(
            SellerProfileSerializer(profile).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SellerStoreView(generics.GenericAPIView):
    """
    Manage the authenticated seller's store.
    GET: Retrieve seller's store.
    POST: Create store (requires seller profile).
    PUT/PATCH: Update store.
    """

    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get_profile(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if not profile:
            raise NotFound("Seller profile not found. Please create one first.")
        return profile

    def get_object(self):
        profile = self.get_profile()
        store = getattr(profile, "store", None)
        if not store:
            raise NotFound("Store not found for this seller. Please create one.")
        return store

    def get(self, request, *args, **kwargs):
        store = self.get_object()
        serializer = self.get_serializer(store)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        profile = self.get_profile()
        if hasattr(profile, "store"):
            return Response(
                {"detail": "A store already exists for this seller."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        store = serializer.save(seller_profile=profile)
        return Response(
            StoreSerializer(store).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request, *args, **kwargs):
        store = self.get_object()
        serializer = self.get_serializer(store, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        store = self.get_object()
        serializer = self.get_serializer(store, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublicStoreListView(generics.ListAPIView):
    """
    Public listing of active stores.
    """

    serializer_class = StoreSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Store.objects.filter(is_active=True, seller_profile__approval_status="approved")
        search = self.request.query_params.get("search", None)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class PublicStoreDetailView(generics.RetrieveAPIView):
    """
    Public detail view of a store by slug.
    """

    serializer_class = StoreDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Store.objects.filter(is_active=True, seller_profile__approval_status="approved")


# ---------------------------------------------------------------------------
# Seller Analytics & Aggregations (ORM Practice)
# ---------------------------------------------------------------------------

class SellerOnboardingStatusView(APIView):
    """
    Returns the seller's current onboarding state so the frontend
    can render the correct step: no_profile, pending, approved, has_store.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile = getattr(request.user, "seller_profile", None)
        if not profile:
            return Response({"step": "no_profile", "approval_status": None, "has_store": False})

        has_store = hasattr(profile, "store") and profile.store is not None
        store_data = None
        if has_store:
            store_data = {
                "id": profile.store.id,
                "name": profile.store.name,
                "slug": profile.store.slug,
                "is_active": profile.store.is_active,
            }

        return Response({
            "step": "has_store" if has_store else profile.approval_status,
            "approval_status": profile.approval_status,
            "has_store": has_store,
            "store": store_data,
            "profile": {
                "id": profile.id,
                "business_name": profile.business_name,
                "business_email": profile.business_email,
                "rejection_reason": profile.rejection_reason,
            },
        })


class SellerAnalyticsView(APIView):
    """
    Provides business intelligence analytics for the authenticated seller's store:
    - Total revenue, order count, and average order value
    - Order counts by fulfillment status
    - Total units sold
    - Product counts & low-stock alerts
    - Top-selling products ranked by units sold and revenue
    """

    permission_classes = [permissions.IsAuthenticated, IsSeller]

    def get(self, request, *args, **kwargs):
        from orders.models import SellerOrder, OrderItem
        from catalog.models import Product

        profile = getattr(request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            raise NotFound("Store not found for this seller.")

        store = profile.store

        # 1. Orders and Revenue Aggregations
        orders_stats = SellerOrder.objects.filter(store=store).aggregate(
            total_orders=Count("id"),
            total_revenue=Sum("subtotal"),
            avg_order_value=Avg("subtotal"),
            pending_orders=Count("id", filter=Q(status="pending")),
            processing_orders=Count("id", filter=Q(status="processing")),
            shipped_orders=Count("id", filter=Q(status="shipped")),
            delivered_orders=Count("id", filter=Q(status="delivered")),
            cancelled_orders=Count("id", filter=Q(status="cancelled")),
        )

        # 2. Product & Inventory Stats
        product_stats = Product.objects.filter(store=store).aggregate(
            total_products=Count("id"),
            active_products=Count("id", filter=Q(is_active=True)),
            low_stock_products=Count("id", filter=Q(stock__lt=5, is_active=True)),
            out_of_stock_products=Count("id", filter=Q(stock=0, is_active=True)),
            total_inventory_units=Sum("stock"),
        )

        # 3. Units Sold
        total_units_sold = (
            OrderItem.objects.filter(seller_order__store=store).aggregate(u=Sum("quantity"))["u"]
            or 0
        )

        # 4. Top 5 Best-Selling Products via Annotation
        top_products = (
            OrderItem.objects.filter(seller_order__store=store)
            .values("product_name")
            .annotate(
                units_sold=Sum("quantity"),
                total_revenue=Sum("line_total"),
            )
            .order_by("-units_sold")[:5]
        )

        return Response(
            {
                "store_name": store.name,
                "overview": {
                    "total_revenue": str(orders_stats["total_revenue"] or "0.00"),
                    "total_orders": orders_stats["total_orders"] or 0,
                    "avg_order_value": str(round(orders_stats["avg_order_value"], 2)) if orders_stats["avg_order_value"] else "0.00",
                    "total_units_sold": total_units_sold,
                },
                "orders_by_status": {
                    "pending": orders_stats["pending_orders"] or 0,
                    "processing": orders_stats["processing_orders"] or 0,
                    "shipped": orders_stats["shipped_orders"] or 0,
                    "delivered": orders_stats["delivered_orders"] or 0,
                    "cancelled": orders_stats["cancelled_orders"] or 0,
                },
                "inventory": {
                    "total_products": product_stats["total_products"] or 0,
                    "active_products": product_stats["active_products"] or 0,
                    "low_stock_products": product_stats["low_stock_products"] or 0,
                    "out_of_stock_products": product_stats["out_of_stock_products"] or 0,
                    "total_inventory_units": product_stats["total_inventory_units"] or 0,
                },
                "top_selling_products": list(top_products),
            },
            status=status.HTTP_200_OK,
        )
