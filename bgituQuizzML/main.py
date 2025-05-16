from fastapi import FastAPI
from .api import router

app = FastAPI(title="BgituQuizzML API", description="ML endpoints for quiz admin panel", version="1.0")
app.include_router(router)