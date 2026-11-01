"""
Catalog API views for Categories, Products, and Product Images.
Demonstrates PostgreSQL Full-Text Search and JSONField querying.
"""

from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Count, Sum, Avg, Min, Max, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.parsers import MultiPartParser, FormParser

from sellers.models import Store
from sellers.permissions import IsSeller, IsApprovedSeller, IsStoreOwner
from .models import Category, Product, ProductImage, Review
from .serializers import (
    CategorySerializer,
    CategoryTreeSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    SellerProductSerializer,
    ProductImageSerializer,
    ReviewSerializer,
)


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------

class CategoryListView(generics.ListAPIView):
    """
    List active categories.
    Pass query parameter `?tree=true` to get hierarchical nested tree.
    """

    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.query_params.get("tree", "").lower() in ("true", "1"):
            return CategoryTreeSerializer
        return CategorySerializer

    def get_queryset(self):
        if self.request.query_params.get("tree", "").lower() in ("true", "1"):
            return Category.objects.filter(is_active=True, parent__isnull=True).prefetch_related("children")
        return Category.objects.filter(is_active=True).select_related("parent")


class CategoryDetailView(generics.RetrieveAPIView):
    """
    Retrieve category details by slug.
    """

    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


# ---------------------------------------------------------------------------
# Public Products (PostgreSQL Full-Text Search + JSONField Filtering)
# ---------------------------------------------------------------------------

class ProductListView(generics.ListAPIView):
    """
    Public product listing with advanced PostgreSQL features:
    - PostgreSQL Full-Text Search (SearchVector + SearchQuery + SearchRank)
    - PostgreSQL JSONField attributes query (?attr_key=color&attr_val=Midnight+Blue)
    - Filtering by category, store, price range, and featured status
    - Dynamic sorting
    """

    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            Product.objects.filter(
                is_active=True,
                store__is_active=True,
                store__seller_profile__approval_status="approved",
            )
            .select_related("store", "category")
            .prefetch_related("images")
        )

        params = self.request.query_params

        # 1. PostgreSQL Full-Text Search (SearchVector + SearchQuery + SearchRank)
        search_term = params.get("search") or params.get("q")
        if search_term:
            query = SearchQuery(search_term)
            vector = SearchVector("name", weight="A") + SearchVector("description", weight="B")
            qs = (
                qs.annotate(rank=SearchRank(vector, query))
                .filter(
                    Q(rank__gte=0.03)
                    | Q(name__icontains=search_term)
                    | Q(description__icontains=search_term)
                )
            )

        # 2. PostgreSQL JSONField attribute filtering (e.g. ?attr_key=color&attr_val=Midnight+Blue)
        attr_key = params.get("attr_key")
        attr_val = params.get("attr_val")
        if attr_key and attr_val:
            # Query PostgreSQL jsonb attributes field using key containment
            qs = qs.filter(attributes__has_key=attr_key, attributes__contains={attr_key: attr_val})

        # 3. Category filter (supports parent or subcategory slug)
        category = params.get("category")
        if category:
            qs = qs.filter(Q(category__slug=category) | Q(category__parent__slug=category))

        # 4. Store filter
        store = params.get("store")
        if store:
            qs = qs.filter(store__slug=store)

        # 5. Price range
        min_price = params.get("min_price")
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except ValueError:
                pass

        max_price = params.get("max_price")
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except ValueError:
                pass

        # 6. Featured flag
        featured = params.get("featured")
        if featured and featured.lower() in ("true", "1"):
            qs = qs.filter(is_featured=True)

        # 7. Ordering
        ordering = params.get("ordering")
        allowed_orderings = ["price", "-price", "created_at", "-created_at", "name", "-name"]
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)
        elif search_term:
            # When searching, rank highest relevance first
            qs = qs.order_by("-rank", "-created_at")
        else:
            qs = qs.order_by("-created_at")

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """
    Public product detail view by slug.
    """

    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Product.objects.filter(
                is_active=True,
                store__is_active=True,
                store__seller_profile__approval_status="approved",
            )
            .select_related("store", "category")
            .prefetch_related("images")
        )


# ---------------------------------------------------------------------------
# Marketplace Analytics & Aggregations (ORM Practice)
# ---------------------------------------------------------------------------

class CatalogAnalyticsView(APIView):
    """
    Marketplace catalog aggregations:
    - Total active products count
    - Price aggregations (min, max, average)
    - Inventory totals
    - Categories annotated with product count and average price
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        active_products = Product.objects.filter(is_active=True, store__is_active=True)

        price_stats = active_products.aggregate(
            min_price=Min("price"),
            max_price=Max("price"),
            avg_price=Avg("price"),
            total_stock=Sum("stock"),
            total_products=Count("id"),
        )

        # Category sales and inventory breakdown via ORM annotation
        category_breakdown = (
            Category.objects.filter(is_active=True)
            .annotate(
                product_count=Count("products", filter=Q(products__is_active=True)),
                avg_price=Avg("products__price", filter=Q(products__is_active=True)),
            )
            .values("id", "name", "slug", "product_count", "avg_price")
            .order_by("-product_count")
        )

        return Response(
            {
                "price_stats": {
                    "total_products": price_stats["total_products"] or 0,
                    "total_stock_units": price_stats["total_stock"] or 0,
                    "min_price": str(price_stats["min_price"]) if price_stats["min_price"] else "0.00",
                    "max_price": str(price_stats["max_price"]) if price_stats["max_price"] else "0.00",
                    "avg_price": str(round(price_stats["avg_price"], 2)) if price_stats["avg_price"] else "0.00",
                },
                "category_breakdown": list(category_breakdown),
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Seller Product Management (Ownership Enforced)
# ---------------------------------------------------------------------------

class SellerProductListCreateView(generics.ListCreateAPIView):
    """
    List all products in the current seller's store, or create a new product.
    Only approved sellers with a store can create products.
    """

    serializer_class = SellerProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsApprovedSeller]

    def get_store(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if not profile:
            raise PermissionDenied("You must have a seller profile.")
        if not profile.is_approved:
            raise PermissionDenied("Your seller account has not been approved yet.")
        store = getattr(profile, "store", None)
        if not store:
            raise ValidationError("You must create a store before adding products.")
        return store

    def get_queryset(self):
        store = self.get_store()
        return Product.objects.filter(store=store).select_related("category").prefetch_related("images")

    def perform_create(self, serializer):
        store = self.get_store()
        serializer.save(store=store)


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a product belonging to the current seller's store.
    """

    serializer_class = SellerProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsApprovedSeller, IsStoreOwner]
    lookup_field = "pk"

    def get_queryset(self):
        profile = getattr(self.request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            return Product.objects.none()
        return Product.objects.filter(store=profile.store).select_related("category").prefetch_related("images")


class ProductImageUploadView(generics.CreateAPIView):
    """
    Upload an image for a specific product owned by the seller.
    """

    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsSeller, IsApprovedSeller]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk, *args, **kwargs):
        profile = getattr(request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            raise PermissionDenied("You do not own a store.")

        try:
            product = Product.objects.get(pk=pk, store=profile.store)
        except Product.DoesNotExist:
            raise NotFound("Product not found in your store.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = serializer.save(product=product)
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)


class ProductImageDeleteView(generics.DestroyAPIView):
    """
    Delete a product image (only by the seller who owns the product).
    """

    permission_classes = [permissions.IsAuthenticated, IsSeller, IsApprovedSeller]

    def delete(self, request, pk, image_id, *args, **kwargs):
        profile = getattr(request.user, "seller_profile", None)
        if not profile or not hasattr(profile, "store"):
            raise PermissionDenied("You do not own a store.")

        try:
            image = ProductImage.objects.get(id=image_id, product__id=pk, product__store=profile.store)
        except ProductImage.DoesNotExist:
            raise NotFound("Product image not found.")

        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """
    List reviews for a product or submit a customer review.
    GET  /api/catalog/products/<slug>/reviews/
    POST /api/catalog/products/<slug>/reviews/
    """

    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        slug = self.kwargs.get("slug")
        return Review.objects.filter(product__slug=slug).select_related("user")

    def perform_create(self, serializer):
        slug = self.kwargs.get("slug")
        try:
            product = Product.objects.get(slug=slug, is_active=True)
        except Product.DoesNotExist:
            raise NotFound("Product not found.")

        if Review.objects.filter(product=product, user=self.request.user).exists():
            raise ValidationError({"detail": "You have already reviewed this product."})

        serializer.save(product=product)
