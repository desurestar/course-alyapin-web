from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Department, DepartmentStaff, ResearchGroup, ResearchGroupMembership
from .permissions import ReadOnlyOrAdmin
from .serializers import DepartmentDetailSerializer, DepartmentInfoUpsertSerializer, DepartmentSerializer, DepartmentStaffSerializer, ResearchGroupDetailSerializer, ResearchGroupMembershipSerializer, ResearchGroupSerializer

User = get_user_model()


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().select_related('head')
    permission_classes = [ReadOnlyOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == 'retrieve':
            # prefetch staff and related users
            qs = qs.prefetch_related('staff__user', 'groups')
        return qs

    def get_serializer_class(self):
        if self.action in ('retrieve',):
            return DepartmentDetailSerializer
        return DepartmentSerializer

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def info(self, request, pk=None):
        dept = self.get_object()
        info = getattr(dept, 'info', None)
        if not info:
            return Response({}, status=200)
        return Response({
            'department': dept.id,
            **DepartmentDetailSerializer(dept).data.get('info', {})
        })

    @action(detail=True, methods=['post', 'put', 'patch'], permission_classes=[ReadOnlyOrAdmin])
    def upsert_info(self, request, pk=None):
        dept = self.get_object()
        info = getattr(dept, 'info', None)
        if info:
            serializer = DepartmentInfoUpsertSerializer(info, data=request.data, partial=True)
        else:
            serializer = DepartmentInfoUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(department=dept)
        return Response(DepartmentInfoUpsertSerializer(obj).data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def employees(self, request, pk=None):
        dept = self.get_object()
        staff_qs = DepartmentStaff.objects.filter(department=dept).select_related('user')
        data = []
        for s in staff_qs:
            u = s.user
            data.append({
                'id': u.id,
                'full_name': getattr(u, 'full_name', f'{u.first_name} {u.last_name}'.strip()),
                'position': s.position,
                'email': u.email,
                'phone': getattr(u, 'phone', None),
            })
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[ReadOnlyOrAdmin])
    def add_employee(self, request, pk=None):
        dept = self.get_object()
        serializer = DepartmentStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(department=dept)
        return Response(DepartmentStaffSerializer(obj).data, status=201)

    @action(detail=True, methods=['post'], permission_classes=[ReadOnlyOrAdmin], url_path='remove-employee')
    def remove_employee(self, request, pk=None):
        dept = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id required'}, status=400)
        DepartmentStaff.objects.filter(department=dept, user_id=user_id).delete()
        return Response(status=204)

class ResearchGroupViewSet(viewsets.ModelViewSet):
    queryset = ResearchGroup.objects.select_related('department', 'leader')
    permission_classes = [ReadOnlyOrAdmin]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ResearchGroupDetailSerializer
        return ResearchGroupSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ('list','retrieve'):
            # prefetch memberships only for listing to expose membership_role efficiently
            qs = qs.prefetch_related('memberships__user')
        return qs

    def perform_create(self, serializer):
        """Ensure creator becomes leader and membership is created.

        Without this, groups created via academic endpoint lack a ResearchGroupMembership
        record, so ProfileView (which derives groups from memberships) won't show the
        newly created group after page refresh. This also sets the leader field if not provided.
        """
        group = serializer.save(leader=self.request.user)
        # create leader membership if missing
        ResearchGroupMembership.objects.get_or_create(
            group=group, user=self.request.user, defaults={'role': 'leader'}
        )

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def members(self, request, pk=None):
        group = self.get_object()
        qs = ResearchGroupMembership.objects.filter(group=group).select_related('user')
        return Response(ResearchGroupMembershipSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[ReadOnlyOrAdmin])
    def add_member(self, request, pk=None):
        group = self.get_object()
        serializer = ResearchGroupMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(group=group)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[ReadOnlyOrAdmin], url_path='remove-member')
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id required'}, status=400)
        ResearchGroupMembership.objects.filter(group=group, user_id=user_id).delete()
        return Response(status=204)
