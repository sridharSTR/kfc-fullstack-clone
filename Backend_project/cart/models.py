from django.db import models
from django.contrib.auth import get_user_model
from food.models import Food

User = get_user_model()


class CartItem(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )

    food = models.ForeignKey(
        Food,
        on_delete=models.CASCADE,
        related_name="cart_items"
    )

    quantity = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # ✅ modern replacement for unique_together
        constraints = [
            models.UniqueConstraint(
                fields=["user", "food"],
                name="unique_user_food_cart"
            )
        ]

        # optional performance improvement
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["food"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.food.name} ({self.quantity})"

    # =========================
    # 🧮 SAFE TOTAL PRICE
    # =========================
    def get_total_price(self):
        if not self.food or not self.food.price:
            return 0

        return float(self.food.price) * self.quantity