from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Article(TimeStamped):
    title = models.CharField(max_length=500)
    abstract = models.TextField(blank=True)
    link = models.URLField(blank=True)
    authors = models.ManyToManyField(User, related_name='articles')

    class Meta:
        ordering = ['-id']
        indexes = [models.Index(fields=['title'])]

    def __str__(self):
        return self.title[:100]

class GroupProject(TimeStamped):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),  # renamed from paused to align with frontend
    ]
    group = models.ForeignKey('academic.ResearchGroup', on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    supervisor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='supervised_projects')
    # Extra fields to match frontend ProjectDetail expectations
    budget = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, blank=True)
    grant_id = models.IntegerField(null=True, blank=True)
    website = models.URLField(blank=True)
    # Simple tags storage (comma-separated). For more advanced queries, use a separate model.
    tags = models.CharField(max_length=500, blank=True, help_text='Comma-separated tags')

    class Meta:
        ordering = ['-id']
        indexes = [models.Index(fields=['group', 'status'])]

    def __str__(self):
        return f'{self.title} ({self.group_id})'

class GroupArticle(models.Model):
    '''Link Article to ResearchGroup (subset of authors)'''
    group = models.ForeignKey('academic.ResearchGroup', on_delete=models.CASCADE, related_name='group_articles')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='in_groups')

    class Meta:
        unique_together = [('group', 'article')]
        indexes = [models.Index(fields=['group', 'article'])]

    def __str__(self):
        return f'{self.article_id} in group {self.group_id}'
