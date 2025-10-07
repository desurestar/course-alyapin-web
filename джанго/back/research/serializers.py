from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Article, GroupProject

User = get_user_model()

class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    class Meta:
        model = User
        fields = ('id','first_name','last_name','email','phone','full_name')

class ArticleAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()

class ArticleSerializer(serializers.ModelSerializer):
    authors = ArticleAuthorSerializer(many=True, read_only=True)
    co_author_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=User.objects.all(), required=False
    )
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ('id','title','abstract','link','authors','co_author_ids','created_at','can_edit')

    def get_can_edit(self, obj: Article):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return False
        return obj.authors.filter(id=user.id).exists()

    def create(self, validated_data):
        co_authors = validated_data.pop('co_author_ids', [])
        request = self.context.get('request')
        user = request.user
        article = Article.objects.create(**validated_data)
        ids = {user.id}
        for u in co_authors:
            ids.add(u.id)
        article.authors.set(User.objects.filter(id__in=ids))
        return article

    def update(self, instance: Article, validated_data):
        co_authors = validated_data.pop('co_author_ids', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if co_authors is not None:
            request = self.context.get('request')
            ids = {request.user.id}
            for u in co_authors:
                ids.add(u.id)
            instance.authors.set(User.objects.filter(id__in=ids))
        return instance

class GroupProjectSerializer(serializers.ModelSerializer):
    supervisor_id = serializers.PrimaryKeyRelatedField(
        source='supervisor', queryset=User.objects.all(), required=False, allow_null=True
    )
    supervisor_name = serializers.CharField(source='supervisor.full_name', read_only=True)
    can_edit = serializers.SerializerMethodField()
    group_id = serializers.IntegerField(source='group.id', read_only=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, allow_empty=True)

    class Meta:
        model = GroupProject
        fields = (
            'id','title','description','status','start_date','end_date',
            'supervisor_id','supervisor_name','group_id','budget','currency','grant_id','website','tags','can_edit'
        )

    def get_can_edit(self, obj: GroupProject):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.group.leader_id == request.user.id

    def to_representation(self, instance: GroupProject):
        data = super().to_representation(instance)
        # split tags by comma
        raw = instance.tags or ''
        data['tags'] = [t for t in [s.strip() for s in raw.split(',')] if t]
        # map internal 'on_hold' to frontend 'paused'
        if data.get('status') == 'on_hold':
            data['status'] = 'paused'
        return data

    def to_internal_value(self, data):
        # Accept tags as list or comma string
        tags_val = data.get('tags')
        if isinstance(tags_val, list):
            data = data.copy()
            data['tags'] = ','.join([str(t).strip() for t in tags_val if str(t).strip()])
        # allow frontend 'paused' value
        if data.get('status') == 'paused':
            data = data.copy()
            data['status'] = 'on_hold'
        return super().to_internal_value(data)

class GroupMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    is_leader = serializers.BooleanField()

class GroupDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    leader_id = serializers.IntegerField(allow_null=True)
    leader_name = serializers.CharField(allow_blank=True)
    members = GroupMemberSerializer(many=True)
    articles = ArticleSerializer(many=True)
    projects = GroupProjectSerializer(many=True)
    members_count = serializers.IntegerField()
    can_manage = serializers.BooleanField()
    is_member = serializers.BooleanField()
    is_leader = serializers.BooleanField()

class ProfileGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    role = serializers.CharField(required=False)
    is_leader = serializers.BooleanField(required=False)
    members_count = serializers.IntegerField(required=False)
    leader_id = serializers.IntegerField(required=False, allow_null=True)
    leader_name = serializers.CharField(required=False, allow_blank=True)
    can_manage = serializers.BooleanField(required=False)
    members = GroupMemberSerializer(many=True, required=False)

class ProfileArticleSerializer(ArticleSerializer):
    pass

class ProfileDetailSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    email = serializers.EmailField(allow_blank=True, allow_null=True)
    phone = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    full_name = serializers.CharField(allow_blank=True, required=False)
    position = serializers.CharField(allow_blank=True, required=False)
    bio = serializers.CharField(allow_blank=True, required=False)
    avatar = serializers.CharField(allow_blank=True, required=False)
    articles = ProfileArticleSerializer(many=True)
    groups = ProfileGroupSerializer(many=True)
    can_edit = serializers.BooleanField()
    stats = serializers.DictField(child=serializers.IntegerField(), required=False)

# Upsert / update profile serializer
class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name','last_name','email','phone','position','bio','avatar')
        extra_kwargs = {
            'avatar': {'required': False},
        }
