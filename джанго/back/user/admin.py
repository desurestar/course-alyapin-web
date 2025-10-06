from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

User = get_user_model()

# Сначала снимаем стандартную регистрацию, чтобы избежать AlreadyRegistered
try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    # Если по какой-то причине еще не был зарегистрирован (например, при тестах) — игнорируем
    pass

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Колонки + телефон
    list_display = ('id', 'username', 'email', 'phone', 'first_name', 'last_name')
    search_fields = ('username', 'email', 'phone')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительно', {'fields': ('phone',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (None, {'fields': ('phone',)}),
    )
