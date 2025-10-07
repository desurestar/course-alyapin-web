from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('academic', '0003_add_deputy_department'),
    ]

    operations = [
        migrations.AlterField(
            model_name='researchgroup',
            name='department',
            field=models.ForeignKey(blank=True, null=True, on_delete=models.CASCADE, related_name='groups', to='academic.department'),
        ),
    ]
