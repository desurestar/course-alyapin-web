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
    # Оставляем (или настраиваем) нужные колонки
    list_display = ('id', 'username', 'email', 'first_name', 'last_name')
    search_fields = ('username', 'email')
    # Можно добавить при необходимости: list_filter, ordering и т.п.
