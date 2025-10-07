from django.contrib.auth import get_user_model
from django.urls import include, path
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter

from .user_update_views import UserPartialUpdateView

User = get_user_model()

class AdminUserSerializerMixin:
    @staticmethod
    def serialize(u):
        return {
            'id': u.id,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'email': u.email or '',
            'phone': getattr(u, 'phone', None),
            'full_name': getattr(u, 'full_name', u.get_full_name()) or '',
            'is_superuser': u.is_superuser,
            'is_staff': u.is_staff,
            'is_active': u.is_active,
            'date_joined': u.date_joined.isoformat() if u.date_joined else None,
        }

class AdminUsersViewSet(viewsets.ViewSet, AdminUserSerializerMixin):
    permission_classes = [permissions.IsAuthenticated]

    def _check_perm(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            self.permission_denied(request, message='Нет прав')

    def list(self, request):
        self._check_perm(request)
        qs = User.objects.all().order_by('-id')
        search = request.query_params.get('search')
        if search:
            s = search.strip()
            if s:
                qs = qs.filter(first_name__icontains=s) | qs.filter(last_name__icontains=s) | qs.filter(email__icontains=s)
        is_superuser = request.query_params.get('is_superuser')
        if is_superuser in ['true','false']:
            qs = qs.filter(is_superuser=(is_superuser=='true'))
        is_staff = request.query_params.get('is_staff')
        if is_staff in ['true','false']:
            qs = qs.filter(is_staff=(is_staff=='true'))
        page = int(request.query_params.get('page', 1) or 1)
        page_size = int(request.query_params.get('page_size', 20) or 20)
        if page_size < 1:
            page_size = 1
        if page_size > 100:
            page_size = 100
        total = qs.count()
        start = (page-1)*page_size
        users = qs[start:start+page_size]
        data = [self.serialize(u) for u in users]
        return Response({'results': data, 'count': total, 'page': page, 'page_size': page_size})

    def retrieve(self, request, pk=None):
        self._check_perm(request)
        u = User.objects.filter(pk=pk).first()
        if not u:
            return Response({'detail':'Not found'}, status=404)
        return Response(self.serialize(u))

    def create(self, request):
        self._check_perm(request)
        data = request.data
        first = (data.get('first_name') or '').strip()
        last = (data.get('last_name') or '').strip()
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''
        if not first or not last:
            raise ValidationError({'detail':'Имя и фамилия обязательны'})
        if not email:
            raise ValidationError({'detail':'Email обязателен'})
        if not password:
            raise ValidationError({'detail':'Пароль обязателен'})
        if User.objects.filter(email=email).exists():
            raise ValidationError({'detail':'Email уже используется'})
        u = User(
            first_name=first,
            last_name=last,
            email=email,
            username=email or None,
            is_superuser=bool(data.get('is_superuser')),
            is_staff= bool(data.get('is_staff', True)),
        )
        phone = data.get('phone')
        if phone:
            setattr(u,'phone', phone.strip())
        u.set_password(password)
        u.save()
        return Response(self.serialize(u), status=201)

    def partial_update(self, request, pk=None):
        self._check_perm(request)
        u = User.objects.filter(pk=pk).first()
        if not u:
            return Response({'detail':'Not found'}, status=404)
        data = request.data
        for field in ['first_name','last_name','email','phone']:
            if field in data and data[field] is not None:
                setattr(u, field, data[field].strip() if isinstance(data[field], str) else data[field])
        # toggles
        for flag in ['is_superuser','is_staff','is_active']:
            if flag in data and data[flag] is not None:
                setattr(u, flag, bool(data[flag]))
        if data.get('password'):
            u.set_password(data['password'])
        u.save()
        return Response(self.serialize(u))

    def destroy(self, request, pk=None):
        self._check_perm(request)
        u = User.objects.filter(pk=pk).first()
        if not u:
            return Response(status=204)
        u.delete()
        return Response(status=204)

router = DefaultRouter()
router.register('admin/users', AdminUsersViewSet, basename='admin-users')

urlpatterns = [
    path('users/<int:pk>/', UserPartialUpdateView.as_view(), name='user-partial-update'),
    path('', include(router.urls)),
]
