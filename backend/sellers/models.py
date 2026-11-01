"""
Seller and Store models for the ShopNest marketplace.

SellerProfile: One-to-one with User, holds business details and approval status.
Store: Belongs to a SellerProfile, represents a seller's storefront.
"""

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class SellerProfile(models.Model):
    """
    Extended profile for users with the 'seller' role.

    Linked one-to-one to the User model. Contains business information
    and an approval workflow managed by platform administrators.
    """

    class ApprovalStatus(models.TextChoices):
        PENDING = "pending", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seller_profile",
    )
    business_name = models.CharField(
        max_length=200,
        help_text="Official business or brand name.",
    )
    business_description = models.TextField(
        blank=True,
        help_text="Brief description of the business.",
    )
    business_email = models.EmailField(
        blank=True,
        help_text="Public business contact email.",
    )
    business_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Public business contact phone.",
    )
    business_address = models.TextField(
        blank=True,
        help_text="Business address for correspondence.",
    )
    approval_status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        db_index=True,
        help_text="Platform approval status. Only approved sellers can list products.",
    )
    rejection_reason = models.TextField(
        blank=True,
        help_text="Reason for rejection, if applicable.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Seller Profile"
        verbose_name_plural = "Seller Profiles"

    def __str__(self):
        return f"{self.business_name} ({self.user.username})"

    @property
    def is_approved(self):
        return self.approval_status == self.ApprovalStatus.APPROVED


class Store(models.Model):
    """
    A seller's storefront on the marketplace.

    Each seller can have one store. Contains store branding,
    description, and active status controlled by the seller
    and platform admins.
    """

    seller_profile = models.OneToOneField(
        SellerProfile,
        on_delete=models.CASCADE,
        related_name="store",
    )
    name = models.CharField(
        max_length=200,
        help_text="Store display name.",
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        help_text="URL-friendly store identifier. Auto-generated from name.",
    )
    description = models.TextField(
        blank=True,
        help_text="Store description shown to customers.",
    )
    logo = models.ImageField(
        upload_to="stores/logos/",
        blank=True,
        null=True,
        help_text="Store logo image.",
    )
    banner = models.ImageField(
        upload_to="stores/banners/",
        blank=True,
        null=True,
        help_text="Store banner image.",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether the store is visible to customers.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Store"
        verbose_name_plural = "Stores"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Store.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
