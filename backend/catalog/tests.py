"""
Tests for Category, Product models and Catalog APIs.
"""

from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from sellers.models import SellerProfile, Store
from catalog.models import Category, Product

User = get_user_model()


class CatalogModelAndAPITests(APITestCase):
    def setUp(self):
        # Users
        self.seller_user1 = User.objects.create_user(
            username="seller1",
            email="seller1@example.com",
            password="Password123!",
            role="seller",
        )
        self.seller_user2 = User.objects.create_user(
            username="seller2",
            email="seller2@example.com",
            password="Password123!",
            role="seller",
        )
        self.customer_user = User.objects.create_user(
            username="customer1",
            email="cust1@example.com",
            password="Password123!",
            role="customer",
        )

        # Approved seller 1 & store
        self.profile1 = SellerProfile.objects.create(
            user=self.seller_user1,
            business_name="Electronics Hub",
            approval_status=SellerProfile.ApprovalStatus.APPROVED,
        )
        self.store1 = Store.objects.create(
            seller_profile=self.profile1,
            name="Electronics Hub Store",
        )

        # Approved seller 2 & store
        self.profile2 = SellerProfile.objects.create(
            user=self.seller_user2,
            business_name="Fashion World",
            approval_status=SellerProfile.ApprovalStatus.APPROVED,
        )
        self.store2 = Store.objects.create(
            seller_profile=self.profile2,
            name="Fashion World Store",
        )

        # Categories
        self.category_electronics = Category.objects.create(name="Electronics")
        self.category_phones = Category.objects.create(
            name="Smartphones",
            parent=self.category_electronics,
        )

        # Products
        self.product1 = Product.objects.create(
            store=self.store1,
            category=self.category_phones,
            name="Pro Phone 15",
            description="High-end smartphone with OLED screen",
            price=Decimal("999.99"),
            compare_at_price=Decimal("1199.99"),
            stock=25,
            is_active=True,
            is_featured=True,
        )
        self.product2 = Product.objects.create(
            store=self.store2,
            category=self.category_electronics,
            name="Noise Cancelling Headphones",
            description="Wireless ANC headphones",
            price=Decimal("199.99"),
            stock=50,
            is_active=True,
        )

    def test_category_hierarchy_tree_api(self):
        url = reverse("catalog:category-list") + "?tree=true"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Root category Electronics should have Smartphones as child
        electronics_data = next((c for c in response.data if c["name"] == "Electronics"), None)
        self.assertIsNotNone(electronics_data)
        self.assertEqual(len(electronics_data["children"]), 1)
        self.assertEqual(electronics_data["children"][0]["name"], "Smartphones")

    def test_public_product_search_and_filter(self):
        url = reverse("catalog:product-list") + "?search=OLED"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Pro Phone 15")

        # Filter by category
        url_cat = reverse("catalog:product-list") + f"?category={self.category_phones.slug}"
        res_cat = self.client.get(url_cat)
        self.assertEqual(res_cat.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_cat.data["results"]), 1)

    def test_seller_can_create_product_in_own_store(self):
        self.client.force_authenticate(user=self.seller_user1)
        url = reverse("catalog:seller-product-list-create")
        data = {
            "name": "Wireless Charging Pad",
            "description": "15W fast magnetic charger",
            "price": "29.99",
            "stock": 100,
            "category": self.category_electronics.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Wireless Charging Pad")
        self.assertTrue(Product.objects.filter(name="Wireless Charging Pad", store=self.store1).exists())

    def test_seller_cannot_modify_another_seller_product(self):
        # seller2 attempts to update product1 (which belongs to seller1)
        self.client.force_authenticate(user=self.seller_user2)
        url = reverse("catalog:seller-product-detail", kwargs={"pk": self.product1.pk})
        data = {"name": "Hacked Product Name", "price": "1.00"}
        response = self.client.patch(url, data, format="json")
        # Should be 404 because queryset is scoped to seller's own store
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify product was NOT modified
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.name, "Pro Phone 15")

    def test_unapproved_seller_cannot_create_product(self):
        # Create unapproved seller
        unapproved_user = User.objects.create_user(
            username="pending_seller",
            email="pending@example.com",
            password="Password123!",
            role="seller",
        )
        SellerProfile.objects.create(
            user=unapproved_user,
            business_name="Unapproved Shop",
            approval_status=SellerProfile.ApprovalStatus.PENDING,
        )
        self.client.force_authenticate(user=unapproved_user)
        url = reverse("catalog:seller-product-list-create")
        data = {
            "name": "Test Unapproved Product",
            "description": "Testing",
            "price": "10.00",
            "stock": 5,
            "category": self.category_electronics.id,
        }
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_postgresql_fulltext_search(self):
        # Searching "OLED" should match Pro Phone 15
        url = reverse("catalog:product-list") + "?q=OLED"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Pro Phone 15")

        # Searching "wireless" should match Headphones
        url2 = reverse("catalog:product-list") + "?q=wireless"
        response2 = self.client.get(url2)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response2.data["results"]), 1)
        self.assertEqual(response2.data["results"][0]["name"], "Noise Cancelling Headphones")

    def test_postgresql_jsonfield_attributes_filter(self):
        # Set attributes on product 1
        self.product1.attributes = {"color": "Midnight Blue", "storage": "256GB"}
        self.product1.save(update_fields=["attributes"])

        url = reverse("catalog:product-list") + "?attr_key=color&attr_val=Midnight+Blue"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["id"], self.product1.id)

    def test_catalog_analytics_aggregations(self):
        url = reverse("catalog:catalog-analytics")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("price_stats", response.data)
        self.assertIn("category_breakdown", response.data)
        self.assertEqual(response.data["price_stats"]["total_products"], 2)
        self.assertEqual(Decimal(response.data["price_stats"]["min_price"]), Decimal("199.99"))
        self.assertEqual(Decimal(response.data["price_stats"]["max_price"]), Decimal("999.99"))

    def test_database_price_check_constraint(self):
        from django.db import IntegrityError
        # Database constraint check_product_positive_price should prevent price <= 0
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                store=self.store1,
                category=self.category_electronics,
                name="Invalid Zero Price Item",
                price=Decimal("0.00"),
                stock=5,
            )

    def test_create_and_list_product_review(self):
        url = reverse("catalog:product-reviews", kwargs={"slug": self.product1.slug})
        self.client.force_authenticate(user=self.customer_user)
        payload = {
            "rating": 5,
            "title": "Incredible Smartphone",
            "comment": "Screen is blazing fast and cameras are top notch.",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["rating"], 5)
        self.assertEqual(response.data["username"], self.customer_user.username)

        # Refresh product and check average rating
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.average_rating, 5.0)
        self.assertEqual(self.product1.review_count, 1)

        # Duplicate review attempt should be rejected
        dup_res = self.client.post(url, payload)
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)

        # List reviews
        self.client.force_authenticate(user=None)
        list_res = self.client.get(url)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data["results"] if "results" in list_res.data else list_res.data), 1)
