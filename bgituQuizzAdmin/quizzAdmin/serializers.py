from rest_framework import serializers
from .models import Game, GameStep

class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = '__all__'

class GameStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameStep
        fields = '__all__' 