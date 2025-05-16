from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.reverse import reverse
from rest_framework.routers import DefaultRouter
from django.http import HttpResponse
from .models import Game, GameStep
from .serializers import GameSerializer, GameStepSerializer

# Create your views here.

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer

class GameStepViewSet(viewsets.ModelViewSet):
    queryset = GameStep.objects.all()
    serializer_class = GameStepSerializer

class ActiveGameWithStepsView(APIView):
    def get(self, request):
        game = Game.objects.filter(isActive=True).order_by('-createdAt').first()
        if not game:
            return Response({'detail': 'Нет активной игры'}, status=status.HTTP_404_NOT_FOUND)
        steps = GameStep.objects.filter(game=game).order_by('order')
        game_data = GameSerializer(game).data
        steps_data = GameStepSerializer(steps, many=True).data
        return Response({'game': game_data, 'steps': steps_data})

@api_view(['GET'])
def admin_api_root(request, format=None):
    return Response({
        'games': '/api/games/',
        'steps': '/api/steps/',
        'active_game': '/api/active_game/',
    }, headers={"X-API-Title": "AdminAPI"})
