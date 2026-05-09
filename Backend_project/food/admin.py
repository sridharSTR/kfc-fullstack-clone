from django.contrib import admin
from django.utils.html import format_html
from .models import Food


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ("id", "image_preview", "name", "category", "price")
    search_fields = ("name", "description", "category")
    list_filter = ("category",)
    ordering = ("name",)
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;" />',
                obj.image.url,
            )
        return "No image"

    image_preview.short_description = "Preview"
