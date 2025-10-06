from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ArticleViewSet, GroupArticleView, GroupDetailView, GroupListCreateView, GroupMembershipActionsView, GroupProjectActionsView, ProfileView, UserGroupsListView, UserSearchView

router = DefaultRouter()
router.register('articles', ArticleViewSet, basename='article')

urlpatterns = [
    # profile aggregation & user search
    path('users/<int:id>/profile/', ProfileView.as_view(), name='profile-detail'),
    path('users/', UserSearchView.as_view(), name='user-search'),
    path('users/<int:user_id>/groups/', UserGroupsListView.as_view(), name='user-groups'),
    # group extended detail
    path('groups/<int:id>/detail/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/', GroupListCreateView.as_view(), name='group-create'),
    # group articles (create/list is via group detail currently; create uses POST here)
    path('groups/<int:group_id>/articles/', GroupArticleView.as_view(), name='group-article-create'),
    path('groups/<int:group_id>/articles/<int:article_id>/', GroupArticleView.as_view(), name='group-article-detail'),
    # group projects CRUD
    path('groups/<int:group_id>/projects/', GroupProjectActionsView.as_view(), name='group-project-create'),
    path('groups/<int:group_id>/projects/<int:project_id>/', GroupProjectActionsView.as_view(), name='group-project-detail'),
    path('groups/<int:id>/leave/', GroupMembershipActionsView.as_view(), {'action':'leave'}, name='group-leave'),
    path('groups/<int:id>/add_member/', GroupMembershipActionsView.as_view(), {'action':'add_member'}, name='group-add-member'),
    path('groups/<int:id>/remove_member/', GroupMembershipActionsView.as_view(), {'action':'remove_member'}, name='group-remove-member'),
] + router.urls
