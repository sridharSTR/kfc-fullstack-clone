from rest_framework.decorators import api_view
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminUserOnly
from .models import Food
from .serializers import FoodSerializer

@api_view(['GET'])
def food_list(request):
    foods = Food.objects.all()
    serializer = FoodSerializer(foods, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def food_detail(request, pk):
    try:
        food = Food.objects.get(pk=pk)
    except Food.DoesNotExist:
        return Response({"error": "Food not found"}, status=404)

    serializer = FoodSerializer(food)
    return Response(serializer.data)


class AdminFoodListCreateView(APIView):
    permission_classes = [IsAdminUserOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        foods = Food.objects.order_by("name")
        serializer = FoodSerializer(foods, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = FoodSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=201)


class AdminFoodDetailView(APIView):
    permission_classes = [IsAdminUserOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, pk):
        try:
            return Food.objects.get(pk=pk)
        except Food.DoesNotExist:
            return None

    def patch(self, request, pk):
        food = self.get_object(pk)
        if not food:
            return Response({"error": "Food not found"}, status=404)

        serializer = FoodSerializer(
            food,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        food = self.get_object(pk)
        if not food:
            return Response({"error": "Food not found"}, status=404)

        food.delete()
        return Response(status=204)
