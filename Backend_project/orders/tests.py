from django.test import TestCase
from django.test import override_settings
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from cart.models import CartItem
from food.models import Food
from .models import Order, OrderItem


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class CheckoutEndpointTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.food = Food.objects.create(
            name="Zinger Burger",
            description="Spicy burger",
            price=199,
            category="burgers",
            image="food/zinger.jpg",
        )
        CartItem.objects.create(user=self.user, food=self.food, quantity=2)

    def test_checkout_creates_order_items_and_clears_cart(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/orders/checkout/",
            {
                "name": "Test User",
                "email": "receipt@example.com",
                "phone": "9876543210",
                "address": "123 Test Street",
                "payment_method": "upi",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Order.objects.first().customer_email, "receipt@example.com")
        self.assertEqual(Order.objects.first().payment_method, "upi")
        self.assertEqual(Order.objects.first().payment_status, "paid")
        self.assertTrue(response.data["email_sent"])
        self.assertEqual(Order.objects.first().delivery_address, "123 Test Street")
        self.assertEqual(OrderItem.objects.count(), 1)
        self.assertEqual(OrderItem.objects.first().food, self.food)
        self.assertEqual(OrderItem.objects.first().quantity, 2)
        self.assertFalse(CartItem.objects.filter(user=self.user).exists())

    def test_order_history_returns_only_current_user_orders(self):
        self.client.force_authenticate(user=self.user)
        order = Order.objects.create(
            user=self.user,
            customer_name="Test User",
            customer_email="test@example.com",
            phone="9876543210",
            delivery_address="123 Test Street",
            total_price=199,
        )
        OrderItem.objects.create(order=order, food=self.food, quantity=1, price=199)

        response = self.client.get("/api/orders/history/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["orders"]), 1)
        self.assertEqual(response.data["orders"][0]["id"], order.id)
        self.assertEqual(response.data["orders"][0]["items"][0]["food_name"], "Zinger Burger")

# Create your tests here.
