"""
Custom admin configuration for the User model.

Provides role and account-status filters, custom list display,
and search capabilities as specified in the workplan.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom UserAdmin with role and account-status filters.
    """

    list_display = (
        "username",
        "email",
        "role",
        "is_active",
        "is_staff",
        "date_joined",
    )
    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
        "date_joined",
    )
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-date_joined",)

    # Add role and extra fields to the admin form
    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "ShopNest Info",
            {
                "fields": ("role", "phone_number", "address"),
            },
        ),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "ShopNest Info",
            {
                "fields": ("role", "phone_number"),
            },
        ),
    )
