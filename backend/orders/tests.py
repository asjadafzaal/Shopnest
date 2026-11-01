"""
Automated tests for Cart, Checkout, Order, SellerOrder, and Permissions.
"""

from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from sellers.models import SellerProfile, Store
from catalog.models import Category, Product
from orders.models import Cart, CartItem, Order, SellerOrder, OrderItem

User = get_user_model()


class MultiVendorOrderAndCheckoutTests(APITestCase):
    def setUp(self):
        # 1. Customers
        self.customer1 = User.objects.create_user(
            username="shopper1",
            email="shopper1@example.com",
            password="Password123!",
            role="customer",
        )
        self.customer2 = User.objects.create_user(
            username="shopper2",
            email="shopper2@example.com",
            password="Password123!",
            role="customer",
        )

        # 2. Sellers & Stores
        # Seller 1: TechZone
        self.seller1 = User.objects.create_user(
            username="seller_tech",
            email="tech@example.com",
            password="Password123!",
            role="seller",
        )
        self.profile1 = SellerProfile.objects.create(
            user=self.seller1,
            business_name="TechZone",
            approval_status=SellerProfile.ApprovalStatus.APPROVED,
        )
        self.store1 = Store.objects.create(
            seller_profile=self.profile1,
            name="TechZone Store",
        )

        # Seller 2: FashionHouse
        self.seller2 = User.objects.create_user(
            username="seller_fashion",
            email="fashion@example.com",
            password="Password123!",
            role="seller",
        )
        self.profile2 = SellerProfile.objects.create(
            user=self.seller2,
            business_name="FashionHouse",
            approval_status=SellerProfile.ApprovalStatus.APPROVED,
        )
        self.store2 = Store.objects.create(
            seller_profile=self.profile2,
            name="FashionHouse Store",
        )

        # 3. Category & Products
        self.category = Category.objects.create(name="General")

        self.product_phone = Product.objects.create(
            store=self.store1,
            category=self.category,
            name="AeroPhone 5G",
            price=Decimal("800.00"),
            stock=10,
            is_active=True,
        )
        self.product_hoodie = Product.objects.create(
            store=self.store2,
            category=self.category,
            name="Urban Cotton Hoodie",
            price=Decimal("60.00"),
            stock=20,
            is_active=True,
        )

        self.shipping_payload = {
            "shipping_full_name": "Jane Doe",
            "shipping_phone": "+1-555-4321",
            "shipping_address": "742 Evergreen Terrace",
            "shipping_city": "Springfield",
            "shipping_state": "IL",
            "shipping_postal_code": "62704",
            "shipping_country": "United States",
            "payment_method": "card_simulation",
        }

    # -----------------------------------------------------------------------
    # Cart Tests
    # -----------------------------------------------------------------------

    def test_get_empty_cart(self):
        self.client.force_authenticate(user=self.customer1)
        url = reverse("orders:cart-detail")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_items"], 0)
        self.assertEqual(Decimal(str(response.data["total_price"])), Decimal("0.00"))
        self.assertTrue(response.data["is_empty"])

    def test_add_and_update_cart(self):
        self.client.force_authenticate(user=self.customer1)
        add_url = reverse("orders:cart-add-item")
        res1 = self.client.post(add_url, {"product_id": self.product_phone.id, "quantity": 1}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res1.data["cart"]["total_items"], 1)

        # Increment
        res2 = self.client.post(add_url, {"product_id": self.product_phone.id, "quantity": 2}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["cart"]["total_items"], 3)
        self.assertEqual(Decimal(str(res2.data["cart"]["total_price"])), Decimal("2400.00"))

    # -----------------------------------------------------------------------
    # Checkout Tests (transaction.atomic & multi-vendor split)
    # -----------------------------------------------------------------------

    def test_checkout_empty_cart_fails(self):
        self.client.force_authenticate(user=self.customer1)
        checkout_url = reverse("orders:checkout")
        response = self.client.post(checkout_url, self.shipping_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_checkout_multi_vendor_success(self):
        """
        Tests checkout containing items from 2 different stores:
        - 1x AeroPhone ($800.00) from TechZone
        - 2x Urban Cotton Hoodie ($60.00 each = $120.00) from FashionHouse
        Total: $920.00
        """
        self.client.force_authenticate(user=self.customer1)
        add_url = reverse("orders:cart-add-item")
        self.client.post(add_url, {"product_id": self.product_phone.id, "quantity": 1}, format="json")
        self.client.post(add_url, {"product_id": self.product_hoodie.id, "quantity": 2}, format="json")

        checkout_url = reverse("orders:checkout")
        response = self.client.post(checkout_url, self.shipping_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order_data = response.data["order"]

        # 1. Total should be $920.00
        self.assertEqual(Decimal(str(order_data["total_amount"])), Decimal("920.00"))
        self.assertEqual(order_data["total_items_count"], 3)

        # 2. Check multi-vendor split: 2 SellerOrders created
        seller_orders = order_data["seller_orders"]
        self.assertEqual(len(seller_orders), 2)

        tech_so = next(so for so in seller_orders if so["store_name"] == "TechZone Store")
        fashion_so = next(so for so in seller_orders if so["store_name"] == "FashionHouse Store")

        self.assertEqual(Decimal(str(tech_so["subtotal"])), Decimal("800.00"))
        self.assertEqual(Decimal(str(fashion_so["subtotal"])), Decimal("120.00"))

        # 3. Check stock was decremented safely
        self.product_phone.refresh_from_db()
        self.product_hoodie.refresh_from_db()
        self.assertEqual(self.product_phone.stock, 9)   # 10 - 1
        self.assertEqual(self.product_hoodie.stock, 18) # 20 - 2

        # 4. Check cart was cleared
        cart = Cart.objects.get(user=self.customer1)
        self.assertTrue(cart.is_empty)

    def test_checkout_stock_depletion_atomic_rollback(self):
        """
        Tests that if one item fails stock verification at checkout,
        the entire atomic transaction rolls back cleanly.
        """
        self.client.force_authenticate(user=self.customer1)
        add_url = reverse("orders:cart-add-item")
        self.client.post(add_url, {"product_id": self.product_phone.id, "quantity": 1}, format="json")

        # Artificially deplete stock in DB before checkout
        self.product_phone.stock = 0
        self.product_phone.save(update_fields=["stock"])

        checkout_url = reverse("orders:checkout")
        response = self.client.post(checkout_url, self.shipping_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verify no orders created
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(SellerOrder.objects.count(), 0)

    # -----------------------------------------------------------------------
    # Customer Order History & Isolation
    # -----------------------------------------------------------------------

    def test_customer_order_history_and_isolation(self):
        # Create order for customer 1
        order1 = Order.objects.create(
            user=self.customer1,
            total_amount=Decimal("100.00"),
            shipping_full_name="Jane Doe",
            shipping_phone="123",
            shipping_address="Address 1",
            shipping_city="City",
            shipping_postal_code="12345",
        )

        # Authenticate customer 1 -> should see order1
        self.client.force_authenticate(user=self.customer1)
        list_url = reverse("orders:customer-order-list")
        res1 = self.client.get(list_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res1.data["results"]), 1)

        # Authenticate customer 2 -> should NOT see order1
        self.client.force_authenticate(user=self.customer2)
        res2 = self.client.get(list_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res2.data["results"]), 0)

        # Customer 2 accessing order1 directly -> 404
        detail_url = reverse("orders:customer-order-detail", kwargs={"id": order1.id})
        res3 = self.client.get(detail_url)
        self.assertEqual(res3.status_code, status.HTTP_404_NOT_FOUND)

    # -----------------------------------------------------------------------
    # Seller Order Fulfillment & Isolation
    # -----------------------------------------------------------------------

    def test_seller_order_isolation_and_status_update(self):
        # Create an order split between store1 and store2
        order = Order.objects.create(
            user=self.customer1,
            total_amount=Decimal("860.00"),
            shipping_full_name="Jane Doe",
            shipping_phone="123",
            shipping_address="Address 1",
            shipping_city="City",
            shipping_postal_code="12345",
        )
        so_tech = SellerOrder.objects.create(
            order=order,
            store=self.store1,
            subtotal=Decimal("800.00"),
            status=SellerOrder.FulfillmentStatus.PENDING,
        )
        so_fashion = SellerOrder.objects.create(
            order=order,
            store=self.store2,
            subtotal=Decimal("60.00"),
            status=SellerOrder.FulfillmentStatus.PENDING,
        )

        # Seller 1 logs in
        self.client.force_authenticate(user=self.seller1)
        seller_list_url = reverse("orders:seller-order-list")
        res_list = self.client.get(seller_list_url)

        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_list.data["results"]), 1)
        self.assertEqual(res_list.data["results"][0]["id"], so_tech.id)

        # Seller 1 updates fulfillment status
        update_url = reverse("orders:seller-order-status-update", kwargs={"id": so_tech.id})
        update_res = self.client.patch(
            update_url,
            {"status": "shipped", "tracking_number": "TRACK-123456", "notes": "Handed to courier."},
            format="json",
        )
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        so_tech.refresh_from_db()
        self.assertEqual(so_tech.status, "shipped")
        self.assertEqual(so_tech.tracking_number, "TRACK-123456")

        # Seller 1 tries to update Seller 2's sub-order -> 404
        forbidden_update_url = reverse("orders:seller-order-status-update", kwargs={"id": so_fashion.id})
        bad_res = self.client.patch(forbidden_update_url, {"status": "shipped"}, format="json")
        self.assertEqual(bad_res.status_code, status.HTTP_404_NOT_FOUND)
