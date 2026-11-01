"""
DRF serializers for user registration, login, and profile management.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    Validates password strength and ensures password confirmation matches.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "role",
            "phone_number",
        )
        read_only_fields = ("id",)

    def validate_email(self, value):
        """Ensure email is unique."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_role(self, value):
        """Only allow customer and seller roles during registration."""
        if value not in (User.Role.CUSTOMER, User.Role.SELLER):
            raise serializers.ValidationError(
                "You can only register as a customer or seller."
            )
        return value

    def validate(self, attrs):
        """Ensure passwords match."""
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        """Create user with hashed password.

        For seller accounts, automatically create a SellerProfile so the
        seller immediately appears in the Django Admin for approval.
        The profile starts in PENDING state.
        """
        from sellers.models import SellerProfile
        user = User.objects.create_user(**validated_data)
        if user.role == User.Role.SELLER:
            SellerProfile.objects.create(
                user=user,
                business_name=f"{user.first_name or user.username}'s Business",
                business_email=user.email,
            )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Read/update serializer for the current authenticated user's profile.
    Role and username are read-only after creation.
    """

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "address",
            "date_joined",
        )
        read_only_fields = ("id", "username", "role", "date_joined")
