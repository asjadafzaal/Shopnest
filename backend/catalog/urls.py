"""
URL configuration for the catalog app.
"""

from django.urls import path

from . import views

app_name = "catalog"

urlpatterns = [
    # Public categories
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("categories/<slug:slug>/", views.CategoryDetailView.as_view(), name="category-detail"),
    # Public products
    path("products/", views.ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("products/<slug:slug>/reviews/", views.ProductReviewListCreateView.as_view(), name="product-reviews"),
    # Marketplace Analytics
    path("analytics/", views.CatalogAnalyticsView.as_view(), name="catalog-analytics"),
    # Seller product management (requires authenticated seller)
    path("seller/products/", views.SellerProductListCreateView.as_view(), name="seller-product-list-create"),
    path("seller/products/<int:pk>/", views.SellerProductDetailView.as_view(), name="seller-product-detail"),
    path("seller/products/<int:pk>/images/", views.ProductImageUploadView.as_view(), name="seller-product-image-upload"),
    path(
        "seller/products/<int:pk>/images/<int:image_id>/",
        views.ProductImageDeleteView.as_view(),
        name="seller-product-image-delete",
    ),
]
