from django.urls import path
from .views import AdminFoodDetailView, AdminFoodListCreateView, food_list, food_detail

urlpatterns = [
    path('admin/', AdminFoodListCreateView.as_view()),
    path('admin/<int:pk>/', AdminFoodDetailView.as_view()),
    path('', food_list),
    path('<int:pk>/', food_detail),
]
