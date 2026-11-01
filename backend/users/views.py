"""
API views for user authentication and profile management.

Endpoints:
    POST /api/auth/register/   — Create a new customer or seller account.
    GET  /api/auth/profile/    — Retrieve the current user's profile.
    PUT  /api/auth/profile/    — Update the current user's profile.

JWT token endpoints (login/refresh) are handled by SimpleJWT in urls.py.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response

from .serializers import UserRegistrationSerializer, UserProfileSerializer


class RegisterView(generics.CreateAPIView):
    """
    Register a new user account.

    Accepts customer or seller role. Returns the created user data
    (without password). Tokens should be obtained via the login endpoint.
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Account created successfully.",
                "user": UserProfileSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's profile.

    GET  — Returns the current user's profile data.
    PUT  — Updates allowed profile fields (email, name, phone, address).
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
