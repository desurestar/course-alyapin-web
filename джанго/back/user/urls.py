from django.urls import path
from .views import (
    PublicRegisterView,
    LoginView,
    RefreshView,
    MeView,
    LogoutView,
)

urlpatterns = [
    path('register/', PublicRegisterView.as_view(), name='register'),
    path('login/',    LoginView.as_view(), name='login'),
    path('refresh/',  RefreshView.as_view(), name='token_refresh'),
    path('me/',       MeView.as_view(), name='me'),
    path('logout/',   LogoutView.as_view(), name='logout'),
]