"""
URL configuration for the users app.

Authentication endpoints:
    POST /api/auth/register/       — Register a new account
    POST /api/auth/login/          — Obtain JWT access + refresh tokens
    POST /api/auth/token/refresh/  — Refresh an expired access token
    GET  /api/auth/profile/        — Current user profile
    PUT  /api/auth/profile/        — Update current user profile
"""

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

app_name = "users"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
]
