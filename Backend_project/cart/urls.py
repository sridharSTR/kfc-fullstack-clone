from django.urls import path
from .views import get_cart, add_to_cart, update_cart_item, remove_cart_item

urlpatterns = [
    path("", get_cart),
    path("add/", add_to_cart),
    path("update/<int:pk>/", update_cart_item),   # ✅ REQUIRED
    path("remove/<int:pk>/", remove_cart_item),
]