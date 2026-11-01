"""
DRF serializers for seller profiles and stores.
"""

from rest_framework import serializers

from .models import SellerProfile, Store


class SellerProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for seller profile data.
    Used for both reading and creating/updating seller profiles.
    """

    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = SellerProfile
        fields = (
            "id",
            "username",
            "business_name",
            "business_description",
            "business_email",
            "business_phone",
            "business_address",
            "approval_status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "approval_status", "created_at", "updated_at")


class StoreSerializer(serializers.ModelSerializer):
    """
    Serializer for store data.
    Includes seller business name for display.
    """

    seller_name = serializers.CharField(
        source="seller_profile.business_name", read_only=True
    )
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Store
        fields = (
            "id",
            "seller_name",
            "name",
            "slug",
            "description",
            "logo",
            "banner",
            "is_active",
            "product_count",
            "created_at",
        )
        read_only_fields = ("id", "slug", "product_count", "created_at")

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class StoreDetailSerializer(StoreSerializer):
    """Extended store serializer with seller profile info."""

    seller_profile = SellerProfileSerializer(read_only=True)

    class Meta(StoreSerializer.Meta):
        fields = StoreSerializer.Meta.fields + ("seller_profile",)
