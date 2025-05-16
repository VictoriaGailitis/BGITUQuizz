import uuid
from django.db import models

class StepType(models.TextChoices):
    OPEN = 'OPEN', 'Открытый вопрос'
    ANSWER_CHOICES = 'ANSWER_CHOICES', 'С вариантами ответов'
    MEDIA_CONTENT = 'MEDIA_CONTENT', 'Медиа-контент'
    TAG_CLOUD = 'TAG_CLOUD', 'Облако тегов'
    TEXT_BLOCK = 'TEXT_BLOCK', 'Текстовый блок'
    FEEDBACK = 'FEEDBACK', 'Обратная связь'
    DIAGRAM = 'DIAGRAM', 'Диаграмма'

class UserRole(models.TextChoices):
    ADMIN = 'ADMIN', 'Администратор'
    PLAYER = 'PLAYER', 'Игрок'

class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name='ID')
    name = models.CharField(max_length=255, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    isActive = models.BooleanField(default=True, verbose_name='Активна')
    createdAt = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        verbose_name = 'Игра'
        verbose_name_plural = 'Игры'

    def __str__(self):
        return self.name

class GameStep(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name='ID')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='steps', verbose_name='Игра')
    type = models.CharField(max_length=32, choices=StepType.choices, verbose_name='Тип шага')
    order = models.IntegerField(verbose_name='Порядок')
    createdAt = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updatedAt = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')
    time_limit = models.IntegerField(default=60, verbose_name='Лимит времени (сек)')
    options = models.JSONField(default=list, blank=True, verbose_name='Дополнительные поля для каждого типа шага')

    class Meta:
        verbose_name = 'Шаг игры'
        verbose_name_plural = 'Шаги игры'
