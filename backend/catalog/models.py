"""
Catalog models for the ShopNest marketplace.

Category: Hierarchical product categories with optional parent/child support.
Product: Belongs to a Store and Category with price, stock, and active status.
ProductImage: Multiple images per product.
"""

from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.text import slugify

from sellers.models import Store


class Category(models.Model):
    """
    Product category with optional parent/child hierarchy.

    Examples:
        Electronics → Phones → Smartphones
        Clothing → Men → Shirts
    """

    name = models.CharField(
        max_length=200,
        help_text="Category display name.",
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        help_text="URL-friendly category identifier.",
    )
    description = models.TextField(
        blank=True,
        help_text="Category description.",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
        help_text="Parent category for hierarchical organization.",
    )
    image = models.ImageField(
        upload_to="categories/",
        blank=True,
        null=True,
        help_text="Category image.",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether the category is visible to customers.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} → {self.name}"
        return self.name

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Product(models.Model):
    """
    A product listed by a seller in their store.

    Contains pricing, stock tracking, and active status.
    Belongs to exactly one Store and one Category.
    """

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name="products",
        help_text="The store this product belongs to.",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        help_text="Product category.",
    )
    name = models.CharField(
        max_length=300,
        help_text="Product display name.",
    )
    slug = models.SlugField(
        max_length=320,
        unique=True,
        help_text="URL-friendly product identifier.",
    )
    description = models.TextField(
        help_text="Detailed product description.",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Product price in USD.",
    )
    compare_at_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Original price before discount (optional, for display).",
    )
    stock = models.PositiveIntegerField(
        default=0,
        help_text="Available quantity in stock.",
    )
    sku = models.CharField(
        max_length=100,
        blank=True,
        help_text="Stock Keeping Unit identifier.",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether the product is visible to customers.",
    )
    is_featured = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the product is featured on the homepage.",
    )
    attributes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Flexible product attributes stored as JSON (e.g., color, size, weight).",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Product"
        verbose_name_plural = "Products"
        indexes = [
            models.Index(fields=["store", "is_active"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["price"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name="check_product_positive_price",
            ),
            models.CheckConstraint(
                check=models.Q(stock__gte=0),
                name="check_product_non_negative_stock",
            ),
            models.CheckConstraint(
                check=models.Q(compare_at_price__isnull=True) | models.Q(compare_at_price__gt=0),
                name="check_product_compare_price_positive",
            ),
        ]

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def has_discount(self):
        return self.compare_at_price and self.compare_at_price > self.price

    @property
    def discount_percentage(self):
        if self.has_discount:
            return round(
                ((self.compare_at_price - self.price) / self.compare_at_price) * 100
            )
        return 0

    @property
    def average_rating(self):
        """Calculate average rating across all reviews."""
        reviews = self.reviews.all()
        if reviews.exists():
            total = sum(r.rating for r in reviews)
            return round(total / reviews.count(), 1)
        return 0.0

    @property
    def review_count(self):
        """Total number of customer reviews."""
        return self.reviews.count()

    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    """
    Images associated with a product.

    Supports multiple images per product with ordering
    and a primary image flag.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(
        upload_to="products/",
        help_text="Product image file.",
    )
    alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Alt text for accessibility.",
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the main product image.",
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which images are displayed.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "-is_primary"]
        verbose_name = "Product Image"
        verbose_name_plural = "Product Images"

    def __str__(self):
        return f"Image for {self.product.name} (#{self.display_order})"


class Review(models.Model):
    """
    Customer review and rating for a product.
    Allows verified or registered customers to rate and review products.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="The product being reviewed.",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="The customer who wrote this review.",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1 to 5 stars.",
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        help_text="Brief headline for the review.",
    )
    comment = models.TextField(
        help_text="Customer feedback and review body.",
    )
    is_verified_purchase = models.BooleanField(
        default=False,
        help_text="Indicates whether the reviewer purchased this product on ShopNest.",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        unique_together = [("product", "user")]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="check_review_rating_1_to_5",
            ),
        ]

    def __str__(self):
        return f"{self.user.username} ({self.rating}★) - {self.product.name}"
