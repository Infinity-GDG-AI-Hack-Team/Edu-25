import os
import time

import fitz
from dotenv import load_dotenv
from google import genai
from google.genai.types import EmbedContentConfig
# from ..config import GEMINI_EMB_MODEL,GOOGLE_API_KEY, SEGMENT_SIZE, COLLECTIONS_DIR
from config import GEMINI_EMB_MODEL,GOOGLE_API_KEY, SEGMENT_SIZE, COLLECTIONS_DIR
from db.client import MongoDBClient

load_dotenv()

# Initialize GenAI client
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
    db = MongoDBClient()
    segments_col = db.select_collection("documents_segments")
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