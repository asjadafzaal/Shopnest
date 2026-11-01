"""
Custom User model for ShopNest multi-vendor marketplace.

Extends Django's AbstractUser with a role field to distinguish
between customers, sellers, and platform administrators.
Must be created before running the first migration.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model with role-based access.

    Roles:
        - customer: Can browse, cart, order, and review products.
        - seller: Can create stores, manage products, and fulfill orders.
        - admin: Platform administrator with full access via Django Admin.
    """

    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        SELLER = "seller", "Seller"
        ADMIN = "admin", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        help_text="Determines user permissions and accessible features.",
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        help_text="Optional contact phone number.",
    )
    address = models.TextField(
        blank=True,
        help_text="Default shipping/billing address.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER

    @property
    def is_seller(self):
        return self.role == self.Role.SELLER

    @property
    def is_platform_admin(self):
        return self.role == self.Role.ADMIN
