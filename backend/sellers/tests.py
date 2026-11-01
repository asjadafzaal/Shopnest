"""
Tests for SellerProfile, Store models and APIs.
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import SellerProfile, Store

User = get_user_model()


class SellerModelAndAPITests(APITestCase):
    def setUp(self):
        # Create seller user
        self.seller_user = User.objects.create_user(
            username="seller1",
            email="seller1@example.com",
            password="Password123!",
            role="seller",
        )
        # Create customer user
        self.customer_user = User.objects.create_user(
            username="cust1",
            email="cust1@example.com",
            password="Password123!",
            role="customer",
        )

    def test_create_seller_profile_via_api(self):
        self.client.force_authenticate(user=self.seller_user)
        url = reverse("sellers:seller-profile")
        data = {
            "business_name": "Tech Gadgets Pro",
            "business_description": "Premier tech seller",
            "business_email": "contact@techgadgets.com",
            "business_phone": "+1234567890",
            "business_address": "123 Tech Lane, Silicon Valley",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["business_name"], "Tech Gadgets Pro")
        self.assertEqual(response.data["approval_status"], "pending")

        # Verify DB
        profile = SellerProfile.objects.get(user=self.seller_user)
        self.assertEqual(profile.business_name, "Tech Gadgets Pro")
        self.assertFalse(profile.is_approved)

    def test_store_creation_and_auto_slug(self):
        profile = SellerProfile.objects.create(
            user=self.seller_user,
            business_name="Gadget Hub",
            approval_status=SellerProfile.ApprovalStatus.APPROVED,
        )
        self.client.force_authenticate(user=self.seller_user)
        url = reverse("sellers:seller-store")
        data = {
            "name": "Gadget Hub Official Store",
            "description": "Best electronics online",
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["slug"], "gadget-hub-official-store")

        store = Store.objects.get(seller_profile=profile)
        self.assertEqual(store.slug, "gadget-hub-official-store")

    def test_customer_cannot_create_store(self):
        self.client.force_authenticate(user=self.customer_user)
        url = reverse("sellers:seller-store")
        data = {"name": "Unauthorized Store"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_analytics_aggregations(self):
        from decimal import Decimal
        from catalog.models import Category, Product
        from orders.models import Order, SellerOrder, OrderItem

        profile = SellerProfile.objects.create(
            user=self.seller_user,
            business_name="Gadget Hub",
            approval_status=SellerProfile.ApprovalStatus.APPROVED,
        )
        store = Store.objects.create(seller_profile=profile, name="Gadget Hub")
        category = Category.objects.create(name="Tech")
        product = Product.objects.create(
            store=store,
            category=category,
            name="Super Earbuds",
            price=Decimal("50.00"),
            stock=15,
        )

        order = Order.objects.create(
            user=self.customer_user,
            total_amount=Decimal("100.00"),
            shipping_full_name="John Doe",
            shipping_phone="123",
            shipping_address="Street",
            shipping_city="City",
            shipping_postal_code="00000",
        )
        seller_order = SellerOrder.objects.create(
            order=order,
            store=store,
            subtotal=Decimal("100.00"),
            status=SellerOrder.FulfillmentStatus.DELIVERED,
        )
        OrderItem.objects.create(
            seller_order=seller_order,
            product=product,
            product_name=product.name,
            price=product.price,
            quantity=2,
            line_total=Decimal("100.00"),
        )

        self.client.force_authenticate(user=self.seller_user)
        url = reverse("sellers:seller-analytics")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["store_name"], "Gadget Hub")
        self.assertEqual(Decimal(response.data["overview"]["total_revenue"]), Decimal("100.00"))
        self.assertEqual(response.data["overview"]["total_orders"], 1)
        self.assertEqual(response.data["overview"]["total_units_sold"], 2)
        self.assertEqual(len(response.data["top_selling_products"]), 1)
        self.assertEqual(response.data["top_selling_products"][0]["product_name"], "Super Earbuds")
