from django.test import TestCase
from rest_framework.test import APIClient
from .models import Game

# Create your tests here.

class APITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        Game.objects.create(name='Тестовая игра')

    def test_game_list(self):
        response = self.client.get('/api/games/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue('Тестовая игра' in str(response.content))
