import os
import sys
import time
import uuid
import fitz
import shutil
from google import genai
from dotenv import load_dotenv
from pymongo.server_api import ServerApi
from pymongo.mongo_client import MongoClient

from google.genai.types import EmbedContentConfig
from fastapi import APIRouter, File, UploadFile, HTTPException

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# from ...src.config import COLLECTIONS_DIR, SEGMENT_SIZE, GEMINI_EMB_MODEL, GOOGLE_API_KEY
# from ...src.db.client import MongoDBClient


load_dotenv("/IdeaProjects/Edu-25/src/.env")

CWD = os.path.dirname(os.path.abspath(__file__))
COLLECTIONS_DIR = os.path.join(CWD, "collections")

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# FAISS index parameters
dIM = 384  # embedding dim of all-MiniLM-L6-v2
INDEX_PATH = os.getenv("INDEX_PATH", "faiss.index")

GEMINI_EMB_MODEL = os.getenv("GEMINI_EMB_MODEL", "gemini-embedding-exp-03-07")
GEMINI_CHAT_MODEL=os.getenv("GEMINI_CHAT_MODEL", "gemini-2.0-flash-001")
SEGMENT_SIZE = int(os.getenv("SEGMENT_SIZE", 1000))


router = APIRouter()

def generate_student_id():
    """
    Generate a unique student ID.
    """
    return int(uuid.uuid4().hex)


gemini_ai_client = genai.Client(api_key=GOOGLE_API_KEY)

def ingest_pdfs(std_id: int, project_name: str, folder_path=COLLECTIONS_DIR):
    """
    Ingest all PDFs, split into segments, embed via GenAI, and store in MongoDB.

    Args:
      std_id: Student identifier
      project_name: e.g. "my_course"
      folder_path: path to PDF folder
    """
    folder_path = os.path.join(folder_path, project_name)
    db_client = MongoClient(
        os.getenv("MONGODB_URI"),
        server_api=ServerApi("1")
    )
    db = db_client[os.getenv("MONGODB_DB_NAME")]
    segments_col = db["documents_segments"]

    files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]

    for fname in files:
        path = os.path.join(folder_path, fname)
        # read PDF file using PyMuPDF
        doc = fitz.open(path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_text = page.get_text()

            for idx in range(0, len(page_text), SEGMENT_SIZE):
                time.sleep(0.5)
                seg_text = page_text[idx: idx + SEGMENT_SIZE].strip()
                print("Segment text:", seg_text)
                if not seg_text:
                    continue
                # Generate embedding
                resp = gemini_ai_client.models.embed_content(
                    model=GEMINI_EMB_MODEL,
                    contents=[seg_text],
                    config=EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
                )
                vec = resp.embeddings[0].values

                # Insert into MongoDB
                doc_record = {
                    "std_id": std_id,
                    "project_name": project_name,
                    "file_name": fname,
                    "page_number": page_num + 1,
                    "segment_index": idx // SEGMENT_SIZE,
                    "text": seg_text,
                    "embedding": list(vec)
                }
                segments_col.insert_one(doc_record)
        doc.close()

    # Update student knowledge base record
    students_col = db.select_collection("test1")
    students_col.update_one(
        {"std_id": std_id},
        {"$set": {"project_name": project_name, "files": files}},
        upsert=True
    )
    print(f"Ingested {len(files)} files for student {std_id} in project '{project_name}'")


@router.post("/upload_file/")
async def upload_pdf(project_name: str, file: UploadFile = File(...)):
    """
    Upload a PDF file and save it to the specified project directory.
    """
    # Check if the project name is valid
    if not project_name.isalnum():
        raise HTTPException(status_code=400, detail="Invalid project name")

    # Create the project directory if it doesn't exist
    collections_dir = os.path.join(COLLECTIONS_DIR, project_name)
    os.makedirs(collections_dir, exist_ok=True)  # Create the directory if it doesn't exist

    # check if there are already files in the directory
    previous_pdfs = [f for f in os.listdir(collections_dir) if f.endswith('.pdf')]

    # Save the uploaded file
    file_path = os.path.join(collections_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # add the file to the list of previous pdfs
    previous_pdfs.append(file.filename)

    # current_file
    current_file = file.filename

    student_data = {
        "student_id": generate_student_id(),
        "project_name": project_name,
        "files": {'pdfs': previous_pdfs},
        "current_active_file": current_file,
        "student_knowledge_base": None,
        "planning_graph": None,
        "known_topics": None
    }

    # Save the student data to the database
    db_client = MongoDBClient()
    student_collection = db_client.select_collection("test1")
    student_collection.insert_one(student_data)
    print("Student data saved to database")

    # Ingest the PDF files:
    # 1. Read the PDF files
    # 2. Split the text into chunks
    # 3. Create embeddings for the chunks
    # 4. Store the embeddings in the database
    # 5. Map the chunks to the original PDF files
    # 6. Store the mapping in the database
    # Ingest the PDF files
    ingest_pdfs(std_id=student_data["student_id"], project_name=project_name, folder_path=COLLECTIONS_DIR)

    return student_data
