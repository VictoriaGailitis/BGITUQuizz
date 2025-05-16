import requests
from .config import ML_API_URL, OPEN_ANSWER_THRESHOLD

def is_swear(text):
    resp = requests.post(f"{ML_API_URL}/analyze_swear", json={"text": text})
    return resp.json().get("swear", False)

def is_correct_open(answer, reference):
    resp = requests.post(f"{ML_API_URL}/check_open_answer", json={"answer": answer, "reference": reference})
    return resp.json().get("similarity", 0) > OPEN_ANSWER_THRESHOLD 