from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("food", "quantity", "price")
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "customer_email",
        "status",
        "payment_method",
        "payment_status",
        "total_price",
        "created_at",
    )
    list_filter = ("status", "payment_method", "payment_status", "created_at")
    search_fields = ("customer_name", "customer_email", "phone", "id")
    readonly_fields = ("user", "created_at", "total_price")
    ordering = ("-created_at",)
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "food", "quantity", "price")
    search_fields = ("order__customer_email", "food__name")
    list_filter = ("order__status",)
    ordering = ("-order__created_at",)
