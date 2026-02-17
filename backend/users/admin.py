from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['wallet_address', 'role', 'created_at', 'is_active']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['wallet_address']
    readonly_fields = ['created_at']