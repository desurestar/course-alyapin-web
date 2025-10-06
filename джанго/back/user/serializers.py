from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'full_name',
            'is_staff',
            'is_superuser',
        )


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    # frontend отправляет только один пароль (auth.ts -> register) поэтому password2 делаем необязательным
    password2 = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            'full_name',
            'first_name',
            'last_name',
            'email',
            'phone',
            'password',
            'password2',  # может отсутствовать
        )

    def validate(self, attrs):
        pwd = attrs.get('password')
        pwd2 = attrs.get('password2')
        # Если фронт не отправил confirm — не проверяем совпадение
        if pwd2 and pwd != pwd2:
            raise serializers.ValidationError({'password': 'Пароли не совпадают'})
        if not attrs.get('email') and not attrs.get('phone'):
            raise serializers.ValidationError('Нужно указать email или phone')
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        # password2 можно игнорировать
        validated_data.pop('password2', None)
        full_name = validated_data.pop('full_name', '').strip()
        if full_name and not validated_data.get('first_name') and not validated_data.get('last_name'):
            parts = full_name.split()
            if len(parts) == 1:
                validated_data['first_name'] = parts[0]
            elif len(parts) >= 2:
                validated_data['last_name'] = parts[0]
                validated_data['first_name'] = ' '.join(parts[1:])
        # Ensure username (AbstractUser requires). If not provided, derive.
        if not validated_data.get('username'):
            base = None
            if validated_data.get('email'):
                base = validated_data['email'].split('@')[0]
            elif validated_data.get('phone'):
                base = validated_data['phone'].lstrip('+')
            else:
                # fallback from first/last or random
                base_parts = [validated_data.get('last_name'), validated_data.get('first_name')]
                base = ''.join(p for p in base_parts if p) or 'user'
            candidate = base[:20] if base else 'user'
            original = candidate
            idx = 1
            from django.contrib.auth import get_user_model
            UserModel = get_user_model()
            while UserModel.objects.filter(username=candidate).exists():
                candidate = f'{original[:15]}{idx}'  # keep length reasonable
                idx += 1
            validated_data['username'] = candidate
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
