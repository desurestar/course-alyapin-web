from rest_framework import permissions

from academic.models import ResearchGroupMembership

from .models import Article, GroupProject


class IsArticleAuthor(permissions.BasePermission):
    def has_object_permission(self, request, view, obj: Article):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.authors.filter(id=request.user.id).exists()

class IsGroupLeader(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # obj can be ResearchGroup, GroupProject, etc.
        if isinstance(obj, GroupProject):
            group = obj.group
        else:
            group = getattr(obj, 'group', obj)
        leader_id = getattr(group, 'leader_id', None)
        return leader_id == request.user.id

class IsGroupMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, GroupProject):
            group = obj.group
        else:
            group = getattr(obj, 'group', obj)
        return ResearchGroupMembership.objects.filter(group=group, user=request.user).exists()
