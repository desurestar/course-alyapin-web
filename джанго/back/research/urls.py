from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, GrantViewSet, GroupArticleView, GroupDetailView, GroupListCreateView, GroupMembershipActionsView, GroupProjectActionsView, ProfileView, ProjectViewSet, UserArticlesListView, UserGroupsListView, UserSearchView

router = DefaultRouter()
router.register('articles', ArticleViewSet, basename='article')
router.register('projects', ProjectViewSet, basename='project')
router.register('grants', GrantViewSet, basename='grant')

urlpatterns = [
    # profile aggregation & user search
    path('users/<int:id>/profile/', ProfileView.as_view(), name='profile-detail'),
    path('users/', UserSearchView.as_view(), name='user-search'),
    path('users/<int:user_id>/groups/', UserGroupsListView.as_view(), name='user-groups'),
    # group detail (RESTful)
    path('groups/<int:id>/', GroupDetailView.as_view(), name='group-detail'),
    # Frontend expects GET /groups/<id>/detail/ for group detail (see groupDetail.ts)
    path('groups/<int:id>/detail/', GroupDetailView.as_view(), name='group-detail-alt'),
    path('groups/', GroupListCreateView.as_view(), name='group-create'),
    # group articles
    path('groups/<int:group_id>/articles/', GroupArticleView.as_view(), name='group-article-create'),
    path('groups/<int:group_id>/articles/<int:article_id>/', GroupArticleView.as_view(), name='group-article-detail'),
    # group projects CRUD
    path('groups/<int:group_id>/projects/', GroupProjectActionsView.as_view(), name='group-project-create'),
    path('groups/<int:group_id>/projects/<int:project_id>/', GroupProjectActionsView.as_view(), name='group-project-detail'),
    # membership actions
    path('groups/<int:id>/leave/', GroupMembershipActionsView.as_view(), {'action':'leave'}, name='group-leave'),
    path('groups/<int:id>/add_member/', GroupMembershipActionsView.as_view(), {'action':'add_member'}, name='group-add-member'),
    path('groups/<int:id>/remove_member/', GroupMembershipActionsView.as_view(), {'action':'remove_member'}, name='group-remove-member'),
    path('users/<int:user_id>/articles/', UserArticlesListView.as_view(), name='user-articles'),
] + router.urls
