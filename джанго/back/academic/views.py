from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Department, DepartmentInfo, ResearchGroup, ResearchGroupMembership
from .serializers import (
    DepartmentSerializer, DepartmentDetailSerializer, DepartmentInfoUpsertSerializer,
    ResearchGroupSerializer, ResearchGroupDetailSerializer,
    ResearchGroupMembershipSerializer
)
from .permissions import ReadOnlyOrAdmin

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().select_related('head')
    permission_classes = [ReadOnlyOrAdmin]

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

class ResearchGroupViewSet(viewsets.ModelViewSet):
    queryset = ResearchGroup.objects.select_related('department', 'leader')
    permission_classes = [ReadOnlyOrAdmin]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ResearchGroupDetailSerializer
        return ResearchGroupSerializer

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