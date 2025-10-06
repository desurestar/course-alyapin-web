from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    phone = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text='Phone number in international or local format'
    )

    position = models.CharField(
        max_length=255,
        blank=True,
        help_text='Должность / позиция пользователя'
    )
    bio = models.TextField(
        blank=True,
        help_text='Краткая биография / описание'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        help_text='Изображение аватара'
    )

    @property
    def full_name(self):  # matches frontend expectation
        base = (self.last_name or '', self.first_name or '')
        return ' '.join(p for p in base if p).strip()

    def __str__(self):  # more informative admin display
        ident = self.username or self.email or self.phone or f'user#{self.pk}'
        return ident

