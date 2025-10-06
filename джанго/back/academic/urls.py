from rest_framework.routers import DefaultRouter
from django.urls import path
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .views import DepartmentViewSet, ResearchGroupViewSet

User = get_user_model()


class EmployeeListAPIView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		# Return minimal set for head selection etc.
		qs = User.objects.all().only('id', 'first_name', 'last_name', 'email')[:500]
		data = [
			{
				'id': u.id,
				'full_name': getattr(u, 'full_name', f'{u.first_name} {u.last_name}'.strip()) or u.username,
				'first_name': u.first_name,
				'last_name': u.last_name,
			}
			for u in qs
		]
		return Response(data)

router = DefaultRouter()
router.register('departments', DepartmentViewSet, basename='department')
router.register('groups', ResearchGroupViewSet, basename='group')

urlpatterns = [
	path('employees/', EmployeeListAPIView.as_view(), name='employee-list')
] + router.urls
