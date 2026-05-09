from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils import timezone

from .models import AdminLoginOTP, CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "id",
        "username",
        "email",
        "is_staff",
        "is_email_verified",
        "admin_request_status",
        "is_active",
        "date_joined",
    )
    search_fields = ("username", "email")
    list_filter = (
        "is_staff",
        "is_superuser",
        "is_email_verified",
        "admin_request_status",
        "is_active",
        "date_joined",
    )
    ordering = ("-date_joined",)
    readonly_fields = ("date_joined", "last_login")
    actions = ("approve_admin_requests", "reject_admin_requests")
    fieldsets = UserAdmin.fieldsets + (
        (
            "Admin access request",
            {
                "fields": (
                    "admin_request_status",
                    "is_email_verified",
                    "admin_requested_at",
                    "admin_approved_at",
                )
            },
        ),
    )

    @admin.action(description="Approve selected admin requests")
    def approve_admin_requests(self, request, queryset):
        if not request.user.is_superuser:
            self.message_user(request, "Only a superuser can approve admin access.", level="error")
            return

        updated = queryset.exclude(is_superuser=True).update(
            is_staff=True,
            admin_request_status=CustomUser.AdminRequestStatus.APPROVED,
            admin_approved_at=timezone.now(),
        )
        self.message_user(request, f"Approved admin access for {updated} user(s).")

    @admin.action(description="Reject selected admin requests")
    def reject_admin_requests(self, request, queryset):
        if not request.user.is_superuser:
            self.message_user(request, "Only a superuser can reject admin access.", level="error")
            return

        updated = queryset.filter(is_staff=False).update(
            admin_request_status=CustomUser.AdminRequestStatus.REJECTED,
        )
        self.message_user(request, f"Rejected admin access for {updated} user(s).")


@admin.register(AdminLoginOTP)
class AdminLoginOTPAdmin(admin.ModelAdmin):
    list_display = ("id", "admin", "created_at", "expires_at", "is_used", "attempts")
    search_fields = ("admin__email", "admin__username")
    list_filter = ("is_used", "created_at", "expires_at")
    ordering = ("-created_at",)
    readonly_fields = ("admin", "code_hash", "created_at", "expires_at", "is_used", "attempts")
