import requests
from .config import ADMIN_API_URL

def get_active_game():
    resp = requests.get(ADMIN_API_URL)
    resp.raise_for_status()
    return resp.json() 