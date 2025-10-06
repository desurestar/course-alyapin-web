from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, EmployeesListAPIView, ResearchGroupViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('groups', ResearchGroupViewSet, basename='group')

urlpatterns = router.urls + [
    path('employees/', EmployeesListAPIView.as_view(), name='employees-list'),
]
