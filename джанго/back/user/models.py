from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	'''Custom user model with optional unique phone field.

	Username retained (can be email later) to minimize changes. Phone and email
	are optional but at least one should be provided during registration (enforced in serializer).
	'''

	phone = models.CharField(
		max_length=20,
		unique=True,
		null=True,
		blank=True,
		help_text='Phone number in international or local format'
	)

	@property
	def full_name(self):  # matches frontend expectation
		base = (self.last_name or '', self.first_name or '')
		return ' '.join(p for p in base if p).strip()

	def __str__(self):  # more informative admin display
		ident = self.username or self.email or self.phone or f'user#{self.pk}'
		return ident

