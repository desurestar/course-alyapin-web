from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('research','0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='groupproject',
            name='status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('planned','Planned'),
                    ('in_progress','In Progress'),
                    ('completed','Completed'),
                    ('on_hold','On Hold'),
                ],
                default='planned'
            )
        ),
        migrations.AddField(
            model_name='groupproject',
            name='budget',
            field=models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True),
        ),
        migrations.AddField(
            model_name='groupproject',
            name='currency',
            field=models.CharField(max_length=8, blank=True),
        ),
        migrations.AddField(
            model_name='groupproject',
            name='grant_id',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='groupproject',
            name='website',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='groupproject',
            name='tags',
            field=models.CharField(max_length=500, blank=True, help_text='Comma-separated tags'),
        ),
    ]
