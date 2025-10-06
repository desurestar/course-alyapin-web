from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Department(TimeStamped):
    name = models.CharField(max_length=255, unique=True)
    short_name = models.CharField(max_length=64, blank=True)
    code = models.CharField(max_length=32, blank=True)
    description = models.TextField(blank=True)
    head = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='headed_departments'
    )

    class Meta:
        ordering = ['name']
        indexes = [models.Index(fields=['name'])]

    def __str__(self):
        return self.name

class DepartmentInfo(TimeStamped):
    department = models.OneToOneField(
        Department, on_delete=models.CASCADE, related_name='info'
    )
    history = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    educational_activities = models.TextField(blank=True)
    scientific_activities = models.TextField(blank=True)
    achievements = models.TextField(blank=True)
    equipment = models.TextField(blank=True)
    contacts = models.TextField(blank=True)  # можно хранить форматированный текст/JSON

    def __str__(self):
        return f"Info for {self.department.name}"

class ResearchGroup(TimeStamped):
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='groups'
    )
    name = models.CharField(max_length=255)
    leader = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='led_groups'
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [('department', 'name')]
        ordering = ['name']
        indexes = [models.Index(fields=['name'])]

    def __str__(self):
        return self.name

class ResearchGroupMembership(TimeStamped):
    ROLE_CHOICES = [
        ('leader', 'Руководитель'),
        ('member', 'Участник'),
        ('assistant', 'Ассистент'),
    ]
    group = models.ForeignKey(
        ResearchGroup, on_delete=models.CASCADE, related_name='memberships'
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='group_memberships'
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default='member')

    class Meta:
        unique_together = [('group', 'user')]
        indexes = [models.Index(fields=['group', 'user'])]

    def __str__(self):
        return f"{self.user} -> {self.group} ({self.role})"