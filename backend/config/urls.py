"""
Root URL configuration for ShopNest.

All API endpoints are prefixed with /api/.
Django Admin is available at /admin/.
API documentation (Swagger/ReDoc) is available at /api/docs/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/auth/", include("users.urls", namespace="users")),
    path("api/sellers/", include("sellers.urls", namespace="sellers")),
    path("api/catalog/", include("catalog.urls", namespace="catalog")),
    path("api/", include("orders.urls", namespace="orders")),
    # API Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/docs/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Customize admin site header
admin.site.site_header = "ShopNest Administration"
admin.site.site_title = "ShopNest Admin"
admin.site.index_title = "Platform Management"
