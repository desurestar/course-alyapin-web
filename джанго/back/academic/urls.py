from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, ResearchGroupViewSet

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('groups', ResearchGroupViewSet, basename='group')

urlpatterns = router.urls