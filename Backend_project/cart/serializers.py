from rest_framework import serializers
from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    # 🔥 READ-ONLY FIELDS FROM FOOD
    food_name = serializers.CharField(source="food.name", read_only=True)
    food_price = serializers.DecimalField(
        source="food.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    food_image = serializers.ImageField(source="food.image", read_only=True)

    # ✅ TOTAL PRICE (SAFE)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "food",
            "food_name",
            "food_price",
            "food_image",
            "quantity",
            "total_price",
        ]
        read_only_fields = ["id"]

    # =========================
    # 🧮 TOTAL PRICE (SAFE + CLEAN)
    # =========================
    def get_total_price(self, obj):
        if not obj.food or obj.quantity is None:
            return 0

        total = obj.food.price * obj.quantity
        return round(float(total), 2)

    # =========================
    # 🔒 VALIDATION
    # =========================
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1")
        return value