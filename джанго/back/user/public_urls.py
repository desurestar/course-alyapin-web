from django.urls import path

from .user_update_views import UserPartialUpdateView

urlpatterns = [
    path('users/<int:pk>/', UserPartialUpdateView.as_view(), name='user-partial-update'),
]
