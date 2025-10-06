from django.contrib import admin

from .models import Department, DepartmentInfo, ResearchGroup, ResearchGroupMembership, DepartmentStaff


class DepartmentStaffInline(admin.TabularInline):
    model = DepartmentStaff
    extra = 0

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'short_name', 'code', 'head')
    search_fields = ('name', 'short_name', 'code')
    list_select_related = ('head',)
    inlines = [DepartmentStaffInline]

@admin.register(DepartmentInfo)
class DepartmentInfoAdmin(admin.ModelAdmin):
    list_display = ('id', 'department', 'updated_at')
    search_fields = ('department__name',)

class MembershipInline(admin.TabularInline):
    model = ResearchGroupMembership
    extra = 0

@admin.register(ResearchGroup)
class ResearchGroupAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'department', 'leader', 'is_active')
    list_filter = ('department', 'is_active')
    search_fields = ('name', 'department__name')
    inlines = [MembershipInline]

@admin.register(ResearchGroupMembership)
class ResearchGroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'group', 'user', 'role')
    list_filter = ('role', 'group__department')
    search_fields = ('group__name', 'user__username', 'user__first_name', 'user__last_name')

@admin.register(DepartmentStaff)
class DepartmentStaffAdmin(admin.ModelAdmin):
    list_display = ('id', 'department', 'user', 'position')
    list_filter = ('department',)
    search_fields = ('department__name', 'user__username', 'user__first_name', 'user__last_name', 'position')
