import base64
import re
from io import BytesIO
from mimetypes import guess_type

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from research.serializers import ProfileUpdateSerializer

ALLOWED_FORMATS = { 'jpeg': 'image/jpeg', 'jpg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif', 'webp': 'image/webp' }

def _detect_image_mime(file_bytes: bytes) -> tuple[str|None,str|None]:
    '''Возвращает (mime, ext) или (None, None) если не распознано.'''
    try:
        img_probe = Image.open(BytesIO(file_bytes))
        fmt = (img_probe.format or '').lower()
        if fmt == 'jpg':
            fmt = 'jpeg'
        if fmt in ALLOWED_FORMATS:
            mime = ALLOWED_FORMATS[fmt]
            ext = 'jpg' if fmt == 'jpeg' else fmt
            return mime, ext
    except Exception:
        return None, None
    return None, None

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
        if avatar_str is not None and 'avatar' not in request.FILES:
            # Если пользователь хочет удалить аватар: пустая строка
            if avatar_str == '' or avatar_str == 'null':
                # помечаем avatar в данных как пустой -> serializer очистит поле
                request._full_data = request.data.copy()
                request._full_data['avatar'] = ''
                avatar_str = None  # чтобы не пытаться парсить как файл

            # data:image/png;base64,iVBORw0KG...
            data_url_match = re.match(r'^data:(?P<mime>[^;]+);base64,(?P<data>.+)$', avatar_str or '')
            raw_data_b64 = None
            if data_url_match:
                raw_data_b64 = data_url_match.group('data')
            else:
                # может быть просто base64 без префикса
                if avatar_str and re.match(r'^[A-Za-z0-9+/=]+$', avatar_str.strip()):
                    raw_data_b64 = avatar_str.strip()
            if raw_data_b64:
                try:
                    file_bytes = base64.b64decode(raw_data_b64)
                except Exception:
                    return Response({'avatar': 'Неверный формат base64 изображения'}, status=400)
                # Определяем mime/расширение
                mime = None
                ext = None
                if data_url_match:
                    mime = data_url_match.group('mime').lower()
                    # привести mime -> ext если разрешено
                    for k,v in ALLOWED_FORMATS.items():
                        if v == mime:
                            ext = 'jpg' if k == 'jpeg' else k
                            break
                if not mime or not ext:
                    mime_detected, ext_detected = _detect_image_mime(file_bytes)
                    if mime_detected:
                        mime, ext = mime_detected, ext_detected
                if not mime or not ext:
                    return Response({'avatar': 'Не удалось определить формат изображения'}, status=400)
                file_name = f'avatar.{ext}'
                # Создаём UploadedFile чтобы был content_type
                upload = SimpleUploadedFile(file_name, file_bytes, content_type=mime or 'application/octet-stream')
                # DRF parsers build request.data (QueryDict). If we only assign to request.FILES
                # but leave request.data['avatar'] as original base64 string the ImageField validator
                # will treat the incoming value as a plain string and raise
                # "The submitted data was not a file". We therefore also mirror the UploadedFile
                # into _full_data (a mutable copy of request.data used by DRF) so serializer sees
                # an actual UploadedFile instance.
                request._full_data = request.data.copy()  # ensure mutable copy
                request.FILES['avatar'] = upload
                request._full_data['avatar'] = upload
        # Валидация присланного файла (как base64 конвертированного, так и multipart)
        avatar_file = request.FILES.get('avatar')
        if avatar_file:
            # Пытаемся определить content_type
            content_type = getattr(avatar_file, 'content_type', None)
            if not content_type:
                guess, _ = guess_type(getattr(avatar_file, 'name', ''))
                content_type = guess
            if not content_type:
                try:
                    pos = avatar_file.tell() if hasattr(avatar_file,'tell') else 0
                    img_probe = Image.open(avatar_file)
                    fmt = (img_probe.format or '').lower()
                    if fmt == 'jpg':
                        fmt = 'jpeg'
                    if fmt in ALLOWED_FORMATS:
                        content_type = ALLOWED_FORMATS[fmt]
                    if hasattr(avatar_file,'seek'):
                        avatar_file.seek(pos)
                except Exception:
                    pass
            if not content_type or content_type not in ALLOWED_FORMATS.values():
                return Response({'avatar': 'Файл должен быть изображением'}, status=400)
            max_size = 5 * 1024 * 1024  # 5MB
            if avatar_file.size > max_size:
                return Response({'avatar': 'Файл слишком большой (>5MB)'}, status=400)
            # Pillow обработка: ресайз до макс 512x512 и конвертация в JPEG (если не gif/webp)
            try:
                original_pos = avatar_file.tell() if hasattr(avatar_file, 'tell') else 0
                img = Image.open(avatar_file)
                img_format = (img.format or '').upper()
                # Конвертация в RGB если есть альфа и не хотим PNG
                keep_original = img_format in {'GIF'}  # gif оставим как есть (может быть анимирован)
                target_format = 'JPEG'
                if img_format == 'WEBP':
                    target_format = 'WEBP'
                if keep_original:
                    avatar_file.seek(original_pos)
                else:
                    img = img.convert('RGB')
                    max_side = 512
                    img.thumbnail((max_side, max_side))
                    buf = BytesIO()
                    save_params = {}
                    if target_format == 'JPEG':
                        save_params = {'quality': 85, 'optimize': True}
                    elif target_format == 'WEBP':
                        save_params = {'quality': 80, 'method': 6}
                    img.save(buf, format=target_format, **save_params)
                    buf.seek(0)
                    new_ext = 'jpg' if target_format == 'JPEG' else target_format.lower()
                    new_name = f'avatar_{request.user.id}.{new_ext}'
                    content_type = 'image/jpeg' if target_format=='JPEG' else f'image/{new_ext}'
                    avatar_file = SimpleUploadedFile(new_name, buf.read(), content_type=content_type)
                    # Обновляем в request.FILES и синхронизируем с _full_data (иначе сериализатор снова увидит строку)
                    request.FILES['avatar'] = avatar_file
                    # Если _full_data ещё не создана (например multipart запрос напрямую), создадим её из request.data
                    if not hasattr(request, '_full_data') or request._full_data is None:
                        request._full_data = request.data.copy()
                    request._full_data['avatar'] = avatar_file
            except Exception:
                return Response({'avatar': 'Не удалось обработать изображение'}, status=400)
        response = super().update(request, *args, **kwargs)
        # Преобразуем avatar в абсолютный URL в ответе
        instance = self.get_object()
        if getattr(instance, 'avatar', None):
            try:
                response.data['avatar'] = request.build_absolute_uri(instance.avatar.url)
            except Exception:
                pass
        return response
