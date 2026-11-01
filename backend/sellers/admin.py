"""
Django Admin configuration for seller-related models.

Features:
    - Seller approval management with status filters
    - Store management with active status
    - Inline store display within seller profiles
    - Bulk actions for seller approval/suspension
"""

from django.contrib import admin

from .models import SellerProfile, Store


class StoreInline(admin.StackedInline):
    """Display store information inline within the seller profile."""

    model = Store
    extra = 0
    fields = ("name", "slug", "description", "logo", "banner", "is_active")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    """
    Admin interface for managing seller profiles and approvals.
    """

    list_display = (
        "business_name",
        "user",
        "approval_status",
        "business_email",
        "created_at",
    )
    list_filter = (
        "approval_status",
        "created_at",
    )
    search_fields = (
        "business_name",
        "user__username",
        "user__email",
        "business_email",
    )
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("approval_status",)
    inlines = [StoreInline]

    fieldsets = (
        (
            "Seller Account",
            {
                "fields": ("user",),
            },
        ),
        (
            "Business Information",
            {
                "fields": (
                    "business_name",
                    "business_description",
                    "business_email",
                    "business_phone",
                    "business_address",
                ),
            },
        ),
        (
            "Approval",
            {
                "fields": ("approval_status", "rejection_reason"),
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

    actions = ["approve_sellers", "suspend_sellers"]

    @admin.action(description="Approve selected sellers")
    def approve_sellers(self, request, queryset):
        updated = queryset.update(approval_status=SellerProfile.ApprovalStatus.APPROVED)
        self.message_user(request, f"{updated} seller(s) approved.")

    @admin.action(description="Suspend selected sellers")
    def suspend_sellers(self, request, queryset):
        updated = queryset.update(
            approval_status=SellerProfile.ApprovalStatus.SUSPENDED
        )
        self.message_user(request, f"{updated} seller(s) suspended.")


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    """
    Admin interface for managing stores.
    """

    list_display = (
        "name",
        "seller_profile",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active", "created_at")
    search_fields = (
        "name",
        "seller_profile__business_name",
        "seller_profile__user__username",
    )
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    list_editable = ("is_active",)
