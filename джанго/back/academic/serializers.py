from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Department, DepartmentInfo, DepartmentStaff, ResearchGroup, ResearchGroupMembership

User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name')

class ResearchGroupMembershipSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    class Meta:
        model = ResearchGroupMembership
        fields = ('id', 'user', 'user_id', 'role')

class ResearchGroupSerializer(serializers.ModelSerializer):
    leader = UserShortSerializer(read_only=True)
    leader_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='leader', write_only=True, required=False
    )
    members_count = serializers.IntegerField(source='memberships.count', read_only=True)
    membership_role = serializers.SerializerMethodField()
    is_leader = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()

    class Meta:
        model = ResearchGroup
        fields = (
            'id', 'name', 'description', 'department',
            'leader', 'leader_id', 'is_active', 'members_count',
            'membership_role','is_leader','can_manage'
        )

    def _get_request_user_id(self):
        req = self.context.get('request')
        if req and req.user and req.user.is_authenticated:
            return req.user.id
        return None

    def get_membership_role(self, obj: ResearchGroup):
        uid = self._get_request_user_id()
        if not uid:
            return None
        m = getattr(obj, '_membership_cache', None)
        if m is None:
            m = obj.memberships.filter(user_id=uid).first()
            obj._membership_cache = m
        if not m:
            return None
        return 'Руководитель' if m.role == 'leader' else 'Участник'

    def get_is_leader(self, obj: ResearchGroup):
        uid = self._get_request_user_id()
        return bool(uid and obj.leader_id == uid)

    def get_can_manage(self, obj: ResearchGroup):
        # можно уточнить права далее
        return self.get_is_leader(obj)

class ResearchGroupDetailSerializer(ResearchGroupSerializer):
    memberships = ResearchGroupMembershipSerializer(many=True, read_only=True)
    class Meta(ResearchGroupSerializer.Meta):
        fields = ResearchGroupSerializer.Meta.fields + ('memberships', 'created_at', 'updated_at')

class DepartmentInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentInfo
        exclude = ('department',)

class DepartmentSerializer(serializers.ModelSerializer):
    head = UserShortSerializer(read_only=True)
    head_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='head', write_only=True, required=False
    )
    deputy = UserShortSerializer(read_only=True)
    deputy_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='deputy', write_only=True, required=False
    )
    groups_count = serializers.IntegerField(source='groups.count', read_only=True)
    employees_count = serializers.IntegerField(source='staff.count', read_only=True)

    class Meta:
        model = Department
        fields = (
            'id', 'name', 'short_name', 'code', 'description',
            'head', 'head_id', 'deputy', 'deputy_id', 'groups_count', 'employees_count'
        )

    def validate(self, attrs):
        head = attrs.get('head', getattr(self.instance, 'head', None) if self.instance else None)
        deputy = attrs.get('deputy', getattr(self.instance, 'deputy', None) if self.instance else None)
        if head and deputy and head == deputy:
            raise serializers.ValidationError({'deputy_id': 'Заместитель не может совпадать с руководителем'})
        return attrs

class DepartmentDetailSerializer(DepartmentSerializer):
    info = DepartmentInfoSerializer(read_only=True)
    groups = ResearchGroupSerializer(many=True, read_only=True)
    # employees (staff) list as expected by frontend: id, full_name, position, email, phone
    employees = serializers.SerializerMethodField()

    class Meta(DepartmentSerializer.Meta):
        fields = DepartmentSerializer.Meta.fields + ('info', 'groups', 'employees', 'created_at', 'updated_at')

    def get_employees(self, obj: Department):
        staff_qs = getattr(obj, 'staff_all_prefetched', None) or obj.staff.select_related('user')
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
        return data


class DepartmentStaffSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='user', write_only=True)

    class Meta:
        model = DepartmentStaff
        fields = ('id', 'department', 'user', 'user_id', 'position')
        read_only_fields = ('id', 'department')

class DepartmentInfoUpsertSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentInfo
        fields = (
            'history', 'mission', 'educational_activities', 'scientific_activities',
            'achievements', 'equipment', 'contacts'
        )
