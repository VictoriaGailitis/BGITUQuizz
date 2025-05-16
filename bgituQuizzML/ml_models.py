from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from check_swear import SwearingCheck

# --- Sentiment Analysis ---
sentiment_pipe = pipeline("text-classification", model="tabularisai/multilingual-sentiment-analysis")

# --- Content Generation ---
gen_tokenizer = AutoTokenizer.from_pretrained("unsloth/gemma-2-2b-it-bnb-4bit")
gen_model = AutoModelForSequenceClassification.from_pretrained("unsloth/gemma-2-2b-it-bnb-4bit")
gen_pipe = pipeline("text-generation", model=gen_model, tokenizer=gen_tokenizer)

# --- Swear Analysis ---
swearing_check = SwearingCheck()

# --- Open Answer Check ---
open_tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")
open_model = AutoModelForSequenceClassification.from_pretrained("DeepPavlov/rubert-base-cased") 