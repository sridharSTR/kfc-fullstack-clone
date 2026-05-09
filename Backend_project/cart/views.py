from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, F, FloatField, ExpressionWrapper

from .models import CartItem
from .serializers import CartItemSerializer
from food.models import Food


# =========================
# 🛒 GET CART + TOTAL
# =========================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    items = CartItem.objects.filter(user=request.user).order_by("-id")

    serializer = CartItemSerializer(items, many=True)

    # ✅ SAFE TOTAL CALCULATION
    total = items.aggregate(
        total=Sum(
            ExpressionWrapper(
                F("food__price") * F("quantity"),
                output_field=FloatField()
            )
        )
    )["total"] or 0

    return Response({
        "items": serializer.data,
        "total_price": round(total, 2)
    })


# =========================
# ➕ ADD TO CART
# =========================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    food_id = request.data.get("product_id")
    quantity = request.data.get("quantity", 1)

    if not food_id:
        return Response({"error": "product_id required"}, status=400)

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response({"error": "Invalid quantity"}, status=400)

    if quantity < 1:
        return Response({"error": "Quantity must be at least 1"}, status=400)

    try:
        food = Food.objects.get(id=food_id)
    except Food.DoesNotExist:
        return Response({"error": "Food not found"}, status=404)

    item, created = CartItem.objects.get_or_create(
        user=request.user,
        food=food
    )

    item.quantity = quantity if created else item.quantity + quantity
    item.save()

    return Response({
        "success": True,
        "item": CartItemSerializer(item).data
    })


# =========================
# 🔥 UPDATE CART ITEM
# =========================
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, pk):
    try:
        item = CartItem.objects.get(id=pk, user=request.user)
    except CartItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=404)

    quantity = request.data.get("quantity")

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response({"error": "Invalid quantity"}, status=400)

    # ❌ AUTO REMOVE
    if quantity <= 0:
        item.delete()
        return Response({
            "success": True,
            "message": "Item removed"
        })

    item.quantity = quantity
    item.save()

    return Response({
        "success": True,
        "item": CartItemSerializer(item).data
    })


# =========================
# ❌ REMOVE ITEM
# =========================
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_cart_item(request, pk):
    try:
        item = CartItem.objects.get(id=pk, user=request.user)
    except CartItem.DoesNotExist:
        return Response({"error": "Item not found"}, status=404)

    item.delete()

    return Response({
        "success": True,
        "message": "Item removed"
    })
