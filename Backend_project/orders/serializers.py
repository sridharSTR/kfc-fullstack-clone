from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    food_name = serializers.SerializerMethodField()
    food_image = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "food_name", "food_image", "quantity", "price", "line_total"]

    def get_food_name(self, obj):
        return obj.food.name if obj.food else "Deleted Item"

    def get_food_image(self, obj):
        if not obj.food or not obj.food.image:
            return ""

        request = self.context.get("request")
        image_url = obj.food.image.url
        return request.build_absolute_uri(image_url) if request else image_url

    def get_line_total(self, obj):
        return obj.get_total_price()


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "created_at",
            "customer_name",
            "customer_email",
            "phone",
            "delivery_address",
            "status",
            "payment_method",
            "payment_status",
            "total_price",
            "items",
        ]
