"""
Django Admin configuration for catalog models.

Features:
    - Category management with hierarchy display
    - Product management with list_display, list_filter, search_fields
    - Product images displayed as inlines
    - Bulk actions for activating/deactivating products
    - Editable fields for quick updates
"""

from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage, Review


class ProductImageInline(admin.TabularInline):
    """Display product images inline within the product form."""

    model = ProductImage
    extra = 1
    fields = ("image", "image_preview", "alt_text", "is_primary", "display_order")
    readonly_fields = ("image_preview",)

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 60px; max-width: 80px;" />',
                obj.image.url,
            )
        return "No image"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin interface for product categories.
    """

    list_display = ("name", "parent", "is_active", "product_count", "created_at")
    list_filter = ("is_active", "parent")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("is_active",)

    @admin.display(description="Products")
    def product_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Admin interface for products.

    Provides comprehensive list view with filters, search,
    editable fields, and image inlines.
    """

    list_display = (
        "name",
        "store",
        "category",
        "price",
        "stock",
        "is_active",
        "is_featured",
        "created_at",
    )
    list_filter = (
        "is_active",
        "is_featured",
        "category",
        "store",
        "created_at",
    )
    search_fields = (
        "name",
        "description",
        "sku",
        "store__name",
    )
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("is_active", "is_featured", "price", "stock")
    inlines = [ProductImageInline]

    fieldsets = (
        (
            "Basic Info",
            {
                "fields": ("store", "category", "name", "slug", "description"),
            },
        ),
        (
            "Pricing & Stock",
            {
                "fields": ("price", "compare_at_price", "stock", "sku"),
            },
        ),
        (
            "Visibility",
            {
                "fields": ("is_active", "is_featured"),
            },
        ),
        (
            "Attributes",
            {
                "classes": ("collapse",),
                "fields": ("attributes",),
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

    actions = ["activate_products", "deactivate_products", "feature_products"]

    @admin.action(description="Activate selected products")
    def activate_products(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} product(s) activated.")

    @admin.action(description="Deactivate selected products")
    def deactivate_products(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} product(s) deactivated.")

    @admin.action(description="Mark selected products as featured")
    def feature_products(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f"{updated} product(s) marked as featured.")


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin interface for product images."""

    list_display = ("product", "image_preview", "is_primary", "display_order")
    list_filter = ("is_primary",)
    search_fields = ("product__name", "alt_text")

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 60px; max-width: 80px;" />',
                obj.image.url,
            )
        return "No image"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for product reviews and ratings."""

    list_display = ("product", "user", "rating", "title", "is_verified_purchase", "created_at")
    list_filter = ("rating", "is_verified_purchase", "created_at")
    search_fields = ("product__name", "user__username", "title", "comment")
    readonly_fields = ("created_at", "updated_at")
