from django import forms
from .models import GameStep, StepType
from django.db import models

class StepTypeTabsWidget(forms.widgets.Widget):
    template_name = 'admin/step_type_tabs_widget.html'

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context['choices'] = StepType.choices
        context['value'] = value
        return context

class GameStepForm(forms.ModelForm):
    class Meta:
        model = GameStep
        fields = "__all__"
        widgets = {
            'type': StepTypeTabsWidget,
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Гарантируем, что поле options всегда есть
        if 'options' not in self.fields:
            self.fields['options'] = forms.CharField(required=False, widget=forms.HiddenInput())
        # Если форма для создания (нет instance.pk) и не задан порядок
        if not self.instance.pk and (not self.initial.get('order')):
            game = self.initial.get('game') or self.data.get('game') or self.data.get('game_step_game')
            if game:
                try:
                    max_order = GameStep.objects.filter(game=game).aggregate(models.Max('order'))['order__max']
                    self.fields['order'].initial = (max_order or 0) + 1
                except Exception:
                    self.fields['order'].initial = 1
            else:
                self.fields['order'].initial = 1
        # Скрываем поля для открытого вопроса по умолчанию, JS покажет если нужно
        # self.fields['open_question'].widget.attrs['class'] = 'field-open_question'
        # self.fields['has_answer'].widget.attrs['class'] = 'field-has_answer'
        # self.fields['open_answer'].widget.attrs['class'] = 'field-open_answer'
        # Для типа с вариантами ответа скрываем стандартное поле options
        self.fields['options'].widget = forms.HiddenInput()

    def clean(self):
        cleaned_data = super().clean()
        # Если тип шага с вариантами ответа, сериализуем варианты из скрытого поля
        if cleaned_data.get('type') == StepType.ANSWER_CHOICES:
            import json
            options_raw = self.data.get('answer_options_json')
            if options_raw:
                try:
                    cleaned_data['options'] = json.loads(options_raw)
                except Exception:
                    self.add_error(None, 'Ошибка сериализации вариантов ответа')
        return cleaned_data 