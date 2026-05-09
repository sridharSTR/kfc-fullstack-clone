from django.db import models
from django.contrib.auth import get_user_model
from food.models import Food
from decimal import Decimal

User = get_user_model()


# =========================
# ORDER MODEL
# =========================
class Order(models.Model):
    class Status(models.TextChoices):
        PLACED = "placed", "Placed"
        CONFIRMED = "confirmed", "Confirmed"
        PREPARING = "preparing", "Preparing"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash on delivery"
        CARD = "card", "Card"
        UPI = "upi", "UPI"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    customer_name = models.CharField(max_length=120, blank=True)
    customer_email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    delivery_address = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLACED,
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00")
    )

    class Meta:
        ordering = ["-created_at"]  # ✅ latest first

    def __str__(self):
        return f"Order #{self.id} - {self.user}"

    # ✅ SAFE TOTAL UPDATE
    def update_total(self):
        total = sum(
            (item.get_total_price() for item in self.items.all()),
            Decimal("0.00")
        )
        self.total_price = total
        self.save(update_fields=["total_price"])


# =========================
# ORDER ITEM MODEL
# =========================
class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        related_name="items",
        on_delete=models.CASCADE
    )

    # ✅ keep item even if food deleted
    food = models.ForeignKey(
        Food,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField()

    # ✅ price snapshot
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00")
    )

    class Meta:
        ordering = ["id"]

    # =========================
    # 💰 TOTAL PER ITEM
    # =========================
    def get_total_price(self):
        return self.price * self.quantity

    # =========================
    # 🔒 SET PRICE ONLY ON CREATE
    # =========================
    def save(self, *args, **kwargs):
        if not self.pk:  # only when creating
            if self.food:
                self.price = self.food.price
        super().save(*args, **kwargs)

    def __str__(self):
        name = self.food.name if self.food else "Deleted Item"
        return f"{name} x {self.quantity}"
