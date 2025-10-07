from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import ResearchGroup, ResearchGroupMembership

from .models import Article, GroupArticle

User = get_user_model()


class ArticleAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='u1', password='pass123')
        self.other = User.objects.create_user(username='u2', password='pass123')
        self.client.login(username='u1', password='pass123')
        # group for group-article tests
        self.group = ResearchGroup.objects.create(name='G1', description='', leader=self.user, department=None)
        ResearchGroupMembership.objects.create(group=self.group, user=self.user, role='leader')

    def test_create_article_with_coauthors(self):
        url = '/api/articles/'
        payload = {
            'title': 'Test Article',
            'abstract': 'Abstract',
            'link': 'https://example.com',
            'co_author_ids': [self.other.id]
        }
        resp = self.client.post(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        art = Article.objects.get()
        self.assertEqual(art.title, 'Test Article')
        self.assertSetEqual(set(art.authors.values_list('id', flat=True)), {self.user.id, self.other.id})

    def test_only_author_can_update(self):
        art = Article.objects.create(title='A', abstract='B', link='')
        art.authors.add(self.user)
        url = f'/api/articles/{art.id}/'
        resp = self.client.patch(url, {'title': 'New'}, format='json')
        self.assertEqual(resp.status_code, 200)
        art.refresh_from_db()
        self.assertEqual(art.title, 'New')
        # login as other non-author
        self.client.logout()
        self.client.login(username='u2', password='pass123')
        resp = self.client.patch(url, {'title': 'Nope'}, format='json')
        self.assertEqual(resp.status_code, 403)

    def test_filter_by_author(self):
        a1 = Article.objects.create(title='T1', abstract='', link='')
        a1.authors.add(self.user)
        a2 = Article.objects.create(title='T2', abstract='', link='')
        a2.authors.add(self.other)
        url = f'/api/articles/?author_id={self.user.id}'
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        ids = [r['id'] for r in resp.json()['results']]
        self.assertIn(a1.id, ids)
        self.assertNotIn(a2.id, ids)

    def test_search(self):
        a1 = Article.objects.create(title='Deep Learning Approaches', abstract='', link='')
        a1.authors.add(self.user)
        a2 = Article.objects.create(title='Other', abstract='', link='')
        a2.authors.add(self.user)
        resp = self.client.get('/api/articles/?search=learning')
        self.assertEqual(resp.status_code, 200)
        titles = [r['title'] for r in resp.json()['results']]
        self.assertIn('Deep Learning Approaches', titles)
        self.assertNotIn('Other', titles)

    def test_page_size_cap(self):
        # create 5 articles
        for i in range(5):
            a = Article.objects.create(title=f'A{i}', abstract='', link='')
            a.authors.add(self.user)
        resp = self.client.get('/api/articles/?page_size=5000')
        self.assertEqual(resp.status_code, 200)
        self.assertLessEqual(resp.json()['page_size'], 100)

    def test_group_article_detach_not_delete(self):
        # create via group endpoint
        payload = { 'title': 'Group Art', 'abstract': '', 'link': '' }
        resp = self.client.post(f'/api/groups/{self.group.id}/articles/', payload, format='json')
        self.assertEqual(resp.status_code, 201, resp.content)
        article_id = resp.json()['id']
        self.assertTrue(Article.objects.filter(id=article_id).exists())
        # detach
        del_resp = self.client.delete(f'/api/groups/{self.group.id}/articles/{article_id}/')
        self.assertEqual(del_resp.status_code, 204)
        # article should still exist
        self.assertTrue(Article.objects.filter(id=article_id).exists())
        # link removed
        self.assertFalse(GroupArticle.objects.filter(group=self.group, article_id=article_id).exists())

    def test_user_articles_endpoint(self):
        art = Article.objects.create(title='UA', abstract='', link='')
        art.authors.add(self.user)
        resp = self.client.get(f'/api/users/{self.user.id}/articles/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(any(a['id'] == art.id for a in data))

    def test_user_search_endpoint(self):
        # ensure search by first_name and email works
        self.user.first_name = 'Алексей'
        self.user.email = 'alex@example.com'
        self.user.save(update_fields=['first_name','email'])
        resp = self.client.get('/api/users/?search=Алек')
        self.assertEqual(resp.status_code, 200)
        ids = [u['id'] for u in resp.json()]
        self.assertIn(self.user.id, ids)
