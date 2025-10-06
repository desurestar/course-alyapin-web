from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Department

User = get_user_model()


def make_auth_headers(user):
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    return {'HTTP_AUTHORIZATION': f'Bearer {access}'}

class DepartmentAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username='admin', password='pass', is_staff=True)
        self.user = User.objects.create_user(username='user', password='pass')

    def test_list_departments_empty(self):
        resp = self.client.get('/api/departments/', **make_auth_headers(self.user))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_create_and_retrieve_department(self):
        data = {
            'name': 'Кафедра тестирования',
            'short_name': 'Тест',
            'code': 'TST',
            'description': 'Описание',
        }
        resp = self.client.post('/api/departments/', data, format='json', **make_auth_headers(self.admin))
        self.assertEqual(resp.status_code, 201, resp.content)
        dept_id = resp.json()['id']

        # retrieve detail
        resp2 = self.client.get(f'/api/departments/{dept_id}/', **make_auth_headers(self.user))
        self.assertEqual(resp2.status_code, 200)
        self.assertEqual(resp2.json()['name'], data['name'])

    def test_permission_non_admin_cannot_create(self):
        resp = self.client.post('/api/departments/', {'name': 'X'}, format='json', **make_auth_headers(self.user))
        self.assertEqual(resp.status_code, 403)

    def test_update_department(self):
        dept = Department.objects.create(name='Dep1')
        resp = self.client.patch(f'/api/departments/{dept.id}/', {'short_name': 'D1'}, format='json', **make_auth_headers(self.admin))
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['short_name'], 'D1')

    def test_delete_department(self):
        dept = Department.objects.create(name='Dep2')
        resp = self.client.delete(f'/api/departments/{dept.id}/', **make_auth_headers(self.admin))
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Department.objects.filter(id=dept.id).exists())

class EmployeesEndpointTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='u1', first_name='Иван', last_name='Иванов', password='pass')
        self.user2 = User.objects.create_user(username='u2', password='pass')

    def test_employees_list(self):
        resp = self.client.get('/api/employees/')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(any(u['id'] == self.user1.id for u in data))
        self.assertTrue(any(u['id'] == self.user2.id for u in data))
