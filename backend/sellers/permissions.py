"""
Permissions for Seller and Store management.
"""

from rest_framework import permissions


class IsSeller(permissions.BasePermission):
    """
    Allows access only to authenticated users with the 'seller' role.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "seller"
        )


class IsApprovedSeller(permissions.BasePermission):
    """
    Allows access only to authenticated sellers whose profile is approved.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if getattr(request.user, "role", None) != "seller":
            return False
        profile = getattr(request.user, "seller_profile", None)
        return bool(profile and profile.is_approved)


class IsStoreOwner(permissions.BasePermission):
    """
    Object-level permission allowing only the owner of the store to modify it.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # If obj is a Store
        if hasattr(obj, "seller_profile"):
            return obj.seller_profile.user == request.user

        # If obj is a Product
        if hasattr(obj, "store"):
            return obj.store.seller_profile.user == request.user

        return False
