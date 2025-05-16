from fastapi import APIRouter
from .schemas import SentimentRequest, GenerateContentRequest, SwearRequest, OpenAnswerRequest
from .ml_models import sentiment_pipe, gen_pipe, swearing_check, open_tokenizer, open_model
import torch

router = APIRouter()

@router.post("/analyze_sentiment")
def analyze_sentiment(req: SentimentRequest):
    result = sentiment_pipe(req.text)
    return {"sentiment": result[0]["label"], "score": result[0]["score"]}

@router.post("/generate_content")
def generate_content(req: GenerateContentRequest):
    full_prompt = f"Ты — составитель вопросов для викторины на тему '{req.topic or 'общая'}'. Составь короткий вопрос для школьников простым языком. {req.prompt}"
    result = gen_pipe(full_prompt, max_new_tokens=60, do_sample=True, temperature=0.7)
    return {"result": result[0]["generated_text"]}

@router.post("/analyze_swear")
def analyze_swear(req: SwearRequest):
    is_swear = bool(swearing_check.predict(req.text)[0])
    proba = float(swearing_check.predict_proba(req.text)[0])
    return {"swear": is_swear, "probability": proba}

@router.post("/check_open_answer")
def check_open_answer(req: OpenAnswerRequest):
    def get_vec(text):
        inputs = open_tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        with torch.no_grad():
            outputs = open_model(**inputs)
        return outputs.logits[0].detach().numpy()
    v1 = get_vec(req.answer)
    v2 = get_vec(req.reference)
    sim = float((v1 @ v2) / (torch.norm(torch.tensor(v1)) * torch.norm(torch.tensor(v2))))
    return {"similarity": sim} 