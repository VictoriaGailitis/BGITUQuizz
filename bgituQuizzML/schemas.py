from pydantic import BaseModel
from typing import Optional

class SentimentRequest(BaseModel):
    text: str

class GenerateContentRequest(BaseModel):
    prompt: str
    topic: Optional[str] = None

class SwearRequest(BaseModel):
    text: str

class OpenAnswerRequest(BaseModel):
    answer: str
    reference: str 