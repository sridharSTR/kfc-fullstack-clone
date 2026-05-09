from django.urls import path
from .views import AdminOrderListView, AdminOrderStatusView, CheckoutView, OrderHistoryView

urlpatterns = [
    path("checkout/", CheckoutView.as_view()),
    path("history/", OrderHistoryView.as_view()),
    path("admin/", AdminOrderListView.as_view()),
    path("admin/<int:pk>/status/", AdminOrderStatusView.as_view()),
]
