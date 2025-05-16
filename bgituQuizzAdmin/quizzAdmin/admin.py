from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.sites import UnfoldAdminSite
from .models import (
    Game, GameStep,
    StepType
)
from .forms import GameStepForm
from django.shortcuts import render
from unfold.admin import ModelAdmin
from django.db.models import Count, Max
from django.http import JsonResponse
import collections
import json
import requests
from django.conf import settings

# --- кастомный AdminSite ---

class CustomAdminSite(UnfoldAdminSite):
    site_header = "BgituQuizzAdmin"
    index_title = "Администрирование сайта"
    index_template = "admin/unfold/index.html"

    def index(self, request, extra_context=None):
        from .models import Game, GameStep
        games = Game.objects.annotate(
            steps_count=Count('steps'),
            last_step_date=Max('steps__createdAt')
        )
        # --- Сбор статистики по обратной связи ---
        feedback_steps = GameStep.objects.filter(type=StepType.FEEDBACK)
        sentiment_counts = collections.Counter()
        for step in feedback_steps:
            sentiment = None
            if isinstance(step.options, dict):
                sentiment = step.options.get('sentiment')
            elif isinstance(step.options, list) and step.options:
                # если options - список, берем первый dict
                if isinstance(step.options[0], dict):
                    sentiment = step.options[0].get('sentiment')
            if sentiment:
                sentiment_counts[sentiment] += 1
            else:
                sentiment_counts['Не опознано'] += 1
        # Для графика нужны массивы labels и data
        sentiment_labels = list(sentiment_counts.keys())
        sentiment_data = [sentiment_counts[k] for k in sentiment_labels]
        opts = Game._meta
        if extra_context is None:
            extra_context = {}
        extra_context['games'] = games
        extra_context['opts'] = opts
        extra_context['sentiment_labels'] = json.dumps(sentiment_labels, ensure_ascii=False)
        extra_context['sentiment_data'] = json.dumps(sentiment_data)
        return super().index(request, extra_context=extra_context)

admin_site = CustomAdminSite()

@admin.register(Game, site=admin_site)
class GameAdmin(ModelAdmin):
    list_display = ("name", "isActive", "createdAt")
    index_template = "admin/custom_index.html"

    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        from .models import GameStep
        if extra_context is None:
            extra_context = {}
        extra_context['gamestep_opts'] = GameStep._meta
        return super().changeform_view(request, object_id, form_url, extra_context)

@admin.register(GameStep, site=admin_site)
class GameStepAdmin(ModelAdmin):
    form = GameStepForm
    fields = (
        'game', 'type', 'order', 'isAIGenerated', 'isManualTransition', 'time_limit', 'score',
        'open_question', 'has_answer', 'open_answer',
        'use_ai_generator', 'ai_prompt', 'options'
    )
    class Media:
        js = ('js/gamestep_tabs.js',)

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        game_id = request.GET.get("game")
        if game_id:
            initial["game"] = game_id
        return initial

    def get_urls(self):
        urls = super().get_urls()
        from django.urls import path
        custom_urls = [
            path('next_order/', self.admin_site.admin_view(self.next_order_view), name='quizzAdmin_gamestep_next_order'),
        ]
        return custom_urls + urls

    def next_order_view(self, request):
        game_id = request.GET.get('game')
        from .models import GameStep
        from django.db.models import Max
        if not game_id:
            return JsonResponse({'next_order': 1})
        try:
            max_order = GameStep.objects.filter(game=game_id).aggregate(Max('order'))['order__max']
            return JsonResponse({'next_order': (max_order or 0) + 1})
        except Exception as e:
            return JsonResponse({'next_order': 1, 'error': str(e)}, status=200)

    def save_model(self, request, obj, form, change):
        # AI генерация
        if getattr(obj, 'use_ai_generator', False):
            prompt = getattr(obj, 'ai_prompt', '')
            try:
                resp = requests.post(
                    settings.ML_GENERATE_CONTENT_URL,
                    json={"prompt": prompt}, timeout=10
                )
                if resp.ok:
                    data = resp.json()
                    # Сохраняем результат генерации в options
                    options = obj.options or {}
                    if isinstance(options, str):
                        import json as _json
                        options = _json.loads(options)
                    options['ai_generated'] = data.get('result')
                    obj.options = options
            except Exception as e:
                pass  # Можно залогировать ошибку
        # Сентимент-анализ для FEEDBACK
        if getattr(obj, 'type', None) == StepType.FEEDBACK:
            options = obj.options or {}
            if isinstance(options, str):
                import json as _json
                options = _json.loads(options)
            if 'sentiment' not in options:
                text = options.get('text') or ''
                try:
                    resp = requests.post(
                        settings.ML_ANALYSE_SENTIMENT_URL,
                        json={"text": text}, timeout=10
                    )
                    if resp.ok:
                        data = resp.json()
                        options['sentiment'] = data.get('sentiment')
                        obj.options = options
                except Exception as e:
                    pass  # Можно залогировать ошибку
        super().save_model(request, obj, form, change)
