from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255, unique=True)),
                ('short_name', models.CharField(blank=True, max_length=64)),
                ('code', models.CharField(blank=True, max_length=32)),
                ('description', models.TextField(blank=True)),
                ('head', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='headed_departments', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.CreateModel(
            name='DepartmentInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('history', models.TextField(blank=True)),
                ('mission', models.TextField(blank=True)),
                ('educational_activities', models.TextField(blank=True)),
                ('scientific_activities', models.TextField(blank=True)),
                ('achievements', models.TextField(blank=True)),
                ('equipment', models.TextField(blank=True)),
                ('contacts', models.TextField(blank=True)),
                ('department', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='info', to='academic.department')),
            ],
        ),
        migrations.CreateModel(
            name='ResearchGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='groups', to='academic.department')),
                ('leader', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='led_groups', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['name'], 'unique_together': {('department', 'name')}},
        ),
        migrations.CreateModel(
            name='DepartmentStaff',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('position', models.CharField(blank=True, max_length=255)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='staff', to='academic.department')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='department_staff_entries', to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('department', 'user')}},
        ),
        migrations.CreateModel(
            name='ResearchGroupMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('role', models.CharField(choices=[('leader', 'Руководитель'), ('member', 'Участник'), ('assistant', 'Ассистент')], default='member', max_length=16)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='memberships', to='academic.researchgroup')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('group', 'user')}},
        ),
        migrations.AddIndex(model_name='department', index=models.Index(fields=['name'], name='academic_de_name_0d11d1_idx')),
        migrations.AddIndex(model_name='researchgroup', index=models.Index(fields=['name'], name='academic_re_name_82c769_idx')),
        migrations.AddIndex(model_name='researchgroupmembership', index=models.Index(fields=['group', 'user'], name='academic_re_group_i_2c3835_idx')),
        migrations.AddIndex(model_name='departmentstaff', index=models.Index(fields=['department', 'user'], name='academic_de_departm_9d4dc4_idx')),
    ]
