"""
DRF serializers for catalog models (categories, products, product images).
"""

from rest_framework import serializers

from .models import Category, Product, ProductImage, Review


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for product categories with child count."""

    children_count = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "parent",
            "image",
            "is_active",
            "children_count",
            "product_count",
        )
        read_only_fields = ("id", "slug")

    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class CategoryTreeSerializer(serializers.ModelSerializer):
    """Nested serializer showing category hierarchy."""

    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "image", "children")

    def get_children(self, obj):
        children = obj.children.filter(is_active=True)
        return CategoryTreeSerializer(children, many=True).data


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images."""

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary", "display_order")
        read_only_fields = ("id",)


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for customer product reviews."""

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "user",
            "username",
            "rating",
            "title",
            "comment",
            "is_verified_purchase",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "product",
            "user",
            "username",
            "is_verified_purchase",
            "created_at",
            "updated_at",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        product = validated_data.get("product")

        from orders.models import OrderItem
        has_purchased = OrderItem.objects.filter(
            seller_order__order__user=user,
            product=product,
            seller_order__status__in=["shipped", "delivered"],
        ).exists()

        validated_data["user"] = user
        validated_data["is_verified_purchase"] = has_purchased
        return super().create(validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """
    Lightweight product serializer for list views.
    Includes primary image, store name, and category name.
    """

    store_name = serializers.CharField(source="store.name", read_only=True)
    store_slug = serializers.CharField(source="store.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "price",
            "compare_at_price",
            "discount_percentage",
            "stock",
            "in_stock",
            "is_featured",
            "store_name",
            "store_slug",
            "category_name",
            "primary_image",
            "average_rating",
            "review_count",
            "created_at",
        )

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if not primary:
            primary = obj.images.first()
        if primary:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(primary.image.url)
            return primary.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Full product serializer for detail views.
    Includes all images, store info, category info, and customer reviews.
    """

    store_name = serializers.CharField(source="store.name", read_only=True)
    store_slug = serializers.CharField(source="store.slug", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "compare_at_price",
            "discount_percentage",
            "stock",
            "in_stock",
            "sku",
            "is_active",
            "is_featured",
            "attributes",
            "store",
            "store_name",
            "store_slug",
            "category",
            "category_name",
            "images",
            "reviews",
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "created_at",
            "updated_at",
        )


class SellerProductSerializer(serializers.ModelSerializer):
    """
    Product serializer for seller CRUD operations.
    The store is automatically set from the seller's profile.
    """

    images = ProductImageSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "compare_at_price",
            "discount_percentage",
            "stock",
            "in_stock",
            "sku",
            "is_active",
            "is_featured",
            "attributes",
            "category",
            "images",
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "is_featured", "created_at", "updated_at")
