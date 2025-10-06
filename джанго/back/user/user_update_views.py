import base64
import re

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from research.serializers import ProfileUpdateSerializer

User = get_user_model()

class UserPartialUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def update(self, request, *args, **kwargs):  # force partial always
        if request.user.id != int(kwargs['pk']):
            return Response({'detail': 'Нет прав'}, status=403)
        kwargs['partial'] = True
        # Fallback: если avatar пришёл строкой (data URL или base64), преобразуем в файл
        avatar_str = request.data.get('avatar')
        if avatar_str and 'avatar' not in request.FILES:
            # data:image/png;base64,iVBORw0KG...
            data_url_match = re.match(r'^data:(?P<mime>[^;]+);base64,(?P<data>.+)$', avatar_str)
            raw_data_b64 = None
            if data_url_match:
                raw_data_b64 = data_url_match.group('data')
            else:
                # может быть просто base64 без префикса
                if re.match(r'^[A-Za-z0-9+/=]+$', avatar_str.strip()):
                    raw_data_b64 = avatar_str.strip()
            if raw_data_b64:
                try:
                    file_bytes = base64.b64decode(raw_data_b64)
                    # Определяем расширение по mime если есть
                    ext = 'png'
                    if data_url_match:
                        mime = data_url_match.group('mime')
                        if mime in ('image/jpeg', 'image/jpg'):
                            ext = 'jpg'
                        elif mime == 'image/png':
                            ext = 'png'
                        elif mime == 'image/gif':
                            ext = 'gif'
                        elif mime == 'image/webp':
                            ext = 'webp'
                    file_name = f'avatar.{ext}'
                    request._full_data = request.data.copy()  # ensure mutable
                    request.FILES['avatar'] = ContentFile(file_bytes, name=file_name)
                except Exception:
                    return Response({'avatar': 'Неверный формат base64 изображения'}, status=400)
        response = super().update(request, *args, **kwargs)
        # Преобразуем avatar в абсолютный URL в ответе
        instance = self.get_object()
        if getattr(instance, 'avatar', None):
            try:
                response.data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            except Exception:
                pass
        return response
        return super().update(request, *args, **kwargs)
