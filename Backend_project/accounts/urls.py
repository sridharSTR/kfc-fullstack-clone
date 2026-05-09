from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    AdminDashboardView,
    AdminLoginView,
    AdminUsersView,
    AdminVerifyOTPView,
    ApproveAdminRequestView,
    PendingAdminRequestsView,
    RejectAdminRequestView,
    RevokeAdminAccessView,
    RegisterView,
    LoginView,
    ProfileView,
    RequestAdminAccessView,
    VerifyRegistrationOTPView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('register/verify-otp/', VerifyRegistrationOTPView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('profile/', ProfileView.as_view()),
    path('request-admin-access/', RequestAdminAccessView.as_view()),
    path('admin/login/', AdminLoginView.as_view()),
    path('admin/verify-otp/', AdminVerifyOTPView.as_view()),
    path('admin/dashboard/', AdminDashboardView.as_view()),
    path('admin/requests/', PendingAdminRequestsView.as_view()),
    path('admin/requests/<int:user_id>/approve/', ApproveAdminRequestView.as_view()),
    path('admin/requests/<int:user_id>/reject/', RejectAdminRequestView.as_view()),
    path('admin/users/<int:user_id>/revoke/', RevokeAdminAccessView.as_view()),
    path('admin/users/', AdminUsersView.as_view()),
]
