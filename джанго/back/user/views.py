from django.contrib.auth import get_user_model
from rest_framework import permissions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.serializers import CharField, Serializer
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserPublicSerializer

User = get_user_model()

REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_COOKIE_AGE = 60 * 60 * 24 * 7  # 7 days
SECURE_COOKIE = False  # change on production


class PublicRegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        resp = Response(
            {
                'access': access_token,
                'user': UserPublicSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )
        self._set_refresh_cookie(resp, str(refresh))
        self.response = resp

    def create(self, request, *args, **kwargs):
        super().create(request, *args, **kwargs)
        return self.response

    def _set_refresh_cookie(self, response, token):
        response.set_cookie(
            REFRESH_COOKIE_NAME,
            token,
            max_age=REFRESH_COOKIE_AGE,
            httponly=True,
            secure=SECURE_COOKIE,
            samesite='Lax',
            path='/api/auth/',
        )


class LoginSerializer(Serializer):
    email = CharField(required=False, allow_blank=True)
    phone = CharField(required=False, allow_blank=True)
    password = CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        phone = attrs.get('phone')
        password = attrs.get('password')
        if not (email or phone):
            raise AuthenticationFailed('Введите email или телефон')
        try:
            user = None
            if email:
                user = User.objects.filter(email__iexact=email).first()
            if not user and phone:
                user = User.objects.filter(phone=phone).first()
            if not user:
                raise AuthenticationFailed('Пользователь не найден')
            if not user.check_password(password):
                raise AuthenticationFailed('Неверные учетные данные')
            attrs['user'] = user
            return attrs
        except AuthenticationFailed:
            raise
        except Exception:
            raise AuthenticationFailed('Ошибка аутентификации')


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        resp = Response(
            {
                'access': access_token,
                'user': UserPublicSerializer(user).data,
            }
        )
        resp.set_cookie(
            REFRESH_COOKIE_NAME,
            str(refresh),
            max_age=REFRESH_COOKIE_AGE,
            httponly=True,
            secure=SECURE_COOKIE,
            samesite='Lax',
            path='/api/auth/',
        )
        return resp


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token_str = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if not token_str:
            return Response({'detail': 'No refresh token'}, status=401)
        try:
            refresh = RefreshToken(token_str)
            user = User.objects.get(id=refresh['user_id'])
            # Rotate: create new refresh & blacklist old if configured
            new_refresh = RefreshToken.for_user(user)
            access_token = str(new_refresh.access_token)
            resp = Response({'access': access_token})
            resp.set_cookie(
                REFRESH_COOKIE_NAME,
                str(new_refresh),
                max_age=REFRESH_COOKIE_AGE,
                httponly=True,
                secure=SECURE_COOKIE,
                samesite='Lax',
                path='/api/auth/',
            )
            return resp
        except Exception:
            return Response({'detail': 'Invalid refresh token'}, status=401)


class MeView(APIView):
    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        resp = Response({'detail': 'Logged out'})
        resp.delete_cookie(REFRESH_COOKIE_NAME, path='/api/auth/')
        return resp
