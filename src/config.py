import os
from dotenv import load_dotenv

load_dotenv()

CWD = os.path.dirname(os.path.abspath(__file__))
COLLECTIONS_DIR = os.path.join(CWD, "collections")

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# FAISS index parameters
dIM = 384  # embedding dim of all-MiniLM-L6-v2
INDEX_PATH = os.getenv("INDEX_PATH", "faiss.index")


GEMINI_EMB_MODEL = os.getenv("GEMINI_EMB_MODEL", "gemini-embedding-exp-03-07")
SEGMENT_SIZE = int(os.getenv("SEGMENT_SIZE", 1000))