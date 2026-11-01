"""
URL configuration for the sellers app.
"""

from django.urls import path

from . import views

app_name = "sellers"

urlpatterns = [
    # Authenticated seller endpoints
    path("profile/", views.SellerProfileView.as_view(), name="seller-profile"),
    path("store/", views.SellerStoreView.as_view(), name="seller-store"),
    path("analytics/", views.SellerAnalyticsView.as_view(), name="seller-analytics"),
    path("onboarding-status/", views.SellerOnboardingStatusView.as_view(), name="seller-onboarding-status"),
    # Public store endpoints
    path("stores/", views.PublicStoreListView.as_view(), name="public-store-list"),
    path("stores/<slug:slug>/", views.PublicStoreDetailView.as_view(), name="public-store-detail"),
]
