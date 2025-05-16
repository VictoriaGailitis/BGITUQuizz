import os
from dotenv import load_dotenv

load_dotenv()

ADMIN_API_URL = os.getenv("ADMIN_API_URL", "http://localhost:8000/api/active_game/")
ML_API_URL = os.getenv("ML_API_URL", "http://localhost:8001")
OPEN_ANSWER_THRESHOLD = float(os.getenv("OPEN_ANSWER_THRESHOLD", 0.7))
API_TOKEN = os.getenv("TG_API_TOKEN", "YOUR_TOKEN") 