from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from academic.models import ResearchGroup, ResearchGroupMembership

from .models import Article, GroupArticle, GroupProject
from .permissions import IsArticleAuthor, IsGroupLeader
from .serializers import ArticleSerializer, GroupProjectSerializer, ProfileUpdateSerializer, UserPublicSerializer

User = get_user_model()

class ArticleViewSet(viewsets.ModelViewSet):
    queryset = Article.objects.all().prefetch_related('authors')
    serializer_class = ArticleSerializer
    permission_classes = [permissions.IsAuthenticated, IsArticleAuthor]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [p() for p in self.permission_classes]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        return ctx

class GroupProjectViewSet(viewsets.ModelViewSet):
    queryset = GroupProject.objects.all().select_related('group','supervisor')
    serializer_class = GroupProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsGroupLeader]

    def perform_create(self, serializer):
        group_id = self.request.data.get('group') or self.request.query_params.get('group')
        group = ResearchGroup.objects.get(pk=group_id)
        if group.leader_id != self.request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        serializer.save(group=group, supervisor=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        group_id = self.request.query_params.get('group')
        if group_id:
            qs = qs.filter(group_id=group_id)
        return qs

class ProfileView(APIView):
    def get(self, request, id: int):
        user = User.objects.filter(pk=id).first()
        if not user:
            return Response({'detail':'Not found'}, status=404)
        # collect articles authored by user
        articles = Article.objects.filter(authors=user).prefetch_related('authors')
        article_data = ArticleSerializer(articles, many=True, context={'request':request}).data
        # groups where user is member
        memberships = ResearchGroupMembership.objects.filter(user=user).select_related('group','group__leader')
        groups = []
        for m in memberships:
            g = m.group
            leader_id = g.leader_id
            members_qs = g.memberships.select_related('user')
            members = [
                {
                    'id': mm.user_id,
                    'full_name': getattr(mm.user,'full_name', mm.user.get_full_name()) or mm.user.username,
                    'is_leader': mm.user_id == leader_id,
                } for mm in members_qs
            ]
            groups.append({
                'id': g.id,
                'name': g.name,
                'description': g.description,
                'role': 'Руководитель' if m.role=='leader' else 'Участник',
                'is_leader': m.role=='leader',
                'members_count': members_qs.count(),
                'leader_id': leader_id,
                'leader_name': getattr(g.leader,'full_name', None),
                'can_manage': m.role=='leader' and request.user.id == user.id,
            })
        data = {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': getattr(user,'phone', None),
            'full_name': getattr(user,'full_name', user.get_full_name()),
            'position': getattr(user,'position',''),
            'bio': getattr(user,'bio',''),
            'avatar': request.build_absolute_uri(user.avatar.url) if getattr(user,'avatar', None) else '',
            'articles': article_data,
            'groups': groups,
            'can_edit': request.user.id == user.id,
            'stats': {'articles': len(article_data), 'groups': len(groups)},
        }
        return Response(data)

    def patch(self, request, id: int):
        if request.user.id != id:
            return Response({'detail':'Нет прав'}, status=403)
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

class UserSearchView(APIView):
    def get(self, request):
        q = request.query_params.get('search','').strip()
        qs = User.objects.all()
        if q:
            qs = qs.filter(first_name__icontains=q) | qs.filter(last_name__icontains=q) | qs.filter(email__icontains=q)
        qs = qs[:50]
        data = UserPublicSerializer(qs, many=True).data
        return Response(data)

class GroupDetailView(APIView):
    def get(self, request, id:int):
        group = ResearchGroup.objects.filter(pk=id).first()
        if not group:
            return Response({'detail':'Not found'}, status=404)
        leader_id = group.leader_id
        member_qs = group.memberships.select_related('user')
        members = [
            {'id': m.user_id,
             'full_name': getattr(m.user,'full_name', m.user.get_full_name()) or m.user.username,
             'is_leader': m.user_id == leader_id} for m in member_qs
        ]
        group_article_ids = GroupArticle.objects.filter(group=group).values_list('article_id', flat=True)
        g_articles = Article.objects.filter(id__in=group_article_ids).prefetch_related('authors')
        articles_data = ArticleSerializer(g_articles, many=True, context={'request':request}).data
        projects = group.projects.select_related('supervisor')
        projects_data = GroupProjectSerializer(projects, many=True, context={'request':request}).data
        data = {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'leader_id': leader_id,
            'leader_name': getattr(group.leader,'full_name', None),
            'members': members,
            'articles': articles_data,
            'projects': projects_data,
            'members_count': member_qs.count(),
            'can_manage': request.user.id == leader_id,
            'is_member': member_qs.filter(user=request.user).exists(),
            'is_leader': request.user.id == leader_id,
        }
        return Response(data)

    def patch(self, request, id:int):
        group = ResearchGroup.objects.filter(pk=id).first()
        if not group:
            return Response({'detail':'Not found'}, status=404)
        # only leader can update name/description or change leader
        if group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        name = request.data.get('name')
        description = request.data.get('description')
        leader_id = request.data.get('leader_id')
        changed = False
        if name is not None:
            group.name = name.strip() or group.name
            changed = True
        if description is not None:
            group.description = description.strip()
            changed = True
        if leader_id is not None and leader_id != group.leader_id:
            # ensure new leader is current member
            if not ResearchGroupMembership.objects.filter(group=group, user_id=leader_id).exists():
                return Response({'detail':'Новый руководитель не является участником'}, status=400)
            group.leader_id = leader_id
            # update membership role flags
            ResearchGroupMembership.objects.filter(group=group, role='leader').exclude(user_id=leader_id).update(role='member')
            ResearchGroupMembership.objects.filter(group=group, user_id=leader_id).update(role='leader')
            changed = True
        if changed:
            group.save()
        return self.get(request, id)  # return fresh detail

    def delete(self, request, id:int):
        group = ResearchGroup.objects.filter(pk=id).first()
        if not group:
            return Response(status=204)
        if group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        group.delete()
        return Response(status=204)

class GroupArticleView(APIView):
    def post(self, request, group_id:int):
        # create article and link
        group = ResearchGroup.objects.filter(pk=group_id).first()
        if not group:
            return Response({'detail':'Group not found'}, status=404)
        if group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        serializer = ArticleSerializer(data=request.data, context={'request':request})
        serializer.is_valid(raise_exception=True)
        article = serializer.save()
        GroupArticle.objects.create(group=group, article=article)
        return Response(ArticleSerializer(article, context={'request':request}).data, status=201)

    def patch(self, request, group_id:int, article_id:int):
        article = Article.objects.filter(pk=article_id, in_groups__group_id=group_id).first()
        if not article:
            return Response({'detail':'Not found'}, status=404)
        if not article.authors.filter(id=request.user.id).exists():
            return Response({'detail':'Нет прав'}, status=403)
        serializer = ArticleSerializer(article, data=request.data, partial=True, context={'request':request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, group_id:int, article_id:int):
        article = Article.objects.filter(pk=article_id, in_groups__group_id=group_id).first()
        if not article:
            return Response(status=204)
        if not article.authors.filter(id=request.user.id).exists():
            return Response({'detail':'Нет прав'}, status=403)
        article.delete()
        return Response(status=204)

class GroupProjectActionsView(APIView):
    def post(self, request, group_id:int):
        group = ResearchGroup.objects.filter(pk=group_id).first()
        if not group:
            return Response({'detail':'Group not found'}, status=404)
        if group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        serializer = GroupProjectSerializer(data=request.data, context={'request':request})
        serializer.is_valid(raise_exception=True)
        project = serializer.save(group=group, supervisor=request.user)
        return Response(GroupProjectSerializer(project, context={'request':request}).data, status=201)

    def patch(self, request, group_id:int, project_id:int):
        project = GroupProject.objects.filter(pk=project_id, group_id=group_id).first()
        if not project:
            return Response({'detail':'Not found'}, status=404)
        if project.group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        serializer = GroupProjectSerializer(project, data=request.data, partial=True, context={'request':request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, group_id:int, project_id:int):
        project = GroupProject.objects.filter(pk=project_id, group_id=group_id).first()
        if not project:
            return Response(status=204)
        if project.group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        project.delete()
        return Response(status=204)

class GroupListCreateView(APIView):
    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'detail':'Название группы обязательно'}, status=400)
        description = (request.data.get('description') or '').strip()
        member_ids = request.data.get('member_ids') or []
        if not isinstance(member_ids, list):
            return Response({'detail':'member_ids must be list'}, status=400)
        with transaction.atomic():
            group = ResearchGroup.objects.create(name=name, description=description, leader=request.user, department=None)  # department optional; set later if model requires
            # ensure current user membership as leader
            ResearchGroupMembership.objects.create(group=group, user=request.user, role='leader')
            # add other members
            for uid in member_ids:
                if uid == request.user.id:
                    continue
                ResearchGroupMembership.objects.get_or_create(group=group, user_id=uid, defaults={'role':'member'})
        return GroupDetailView().get(request, group.id)

class GroupMembershipActionsView(APIView):
    def post(self, request, id:int, action:str):
        group = ResearchGroup.objects.filter(pk=id).first()
        if not group:
            return Response({'detail':'Not found'}, status=404)
        if action == 'leave':
            # user leaves the group
            ResearchGroupMembership.objects.filter(group=group, user=request.user).delete()
            # reassign leader if leader left
            if group.leader_id == request.user.id:
                new_leader = ResearchGroupMembership.objects.filter(group=group).order_by('id').first()
                if new_leader:
                    group.leader_id = new_leader.user_id
                    group.save(update_fields=['leader'])
                    ResearchGroupMembership.objects.filter(pk=new_leader.id).update(role='leader')
            return Response({'detail':'left'})
        # other membership management requires leader rights
        if group.leader_id != request.user.id:
            return Response({'detail':'Нет прав'}, status=403)
        if action == 'add_member':
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({'detail':'user_id required'}, status=400)
            ResearchGroupMembership.objects.get_or_create(group=group, user_id=user_id, defaults={'role':'member'})
            return Response({'detail':'added'}, status=201)
        if action == 'remove_member':
            user_id = request.data.get('user_id')
            if not user_id:
                return Response({'detail':'user_id required'}, status=400)
            if user_id == group.leader_id:
                return Response({'detail':'Нельзя удалить руководителя'}, status=400)
            ResearchGroupMembership.objects.filter(group=group, user_id=user_id).delete()
            return Response(status=204)
        return Response({'detail':'Unknown action'}, status=400)

class UserGroupsListView(APIView):
    def get(self, request, user_id:int):
        user = User.objects.filter(pk=user_id).first()
        if not user:
            return Response({'detail':'Not found'}, status=404)
        memberships = ResearchGroupMembership.objects.filter(user=user).select_related('group','group__leader')
        data = []
        for m in memberships:
            g = m.group
            member_count = ResearchGroupMembership.objects.filter(group=g).count()
            data.append({
                'id': g.id,
                'name': g.name,
                'description': g.description,
                'members_count': member_count,
                'leader_id': g.leader_id,
                'leader_name': getattr(g.leader,'full_name', None),
                'role': 'Руководитель' if m.role=='leader' else 'Участник',
                'is_leader': m.role=='leader',
                'can_manage': m.role=='leader' and request.user.id == user.id,
            })
        return Response(data)
