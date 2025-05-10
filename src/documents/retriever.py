from google import genai
import numpy as np
from google.genai.types import EmbedContentConfig
from config import GEMINI_EMB_MODEL,GOOGLE_API_KEY, SEGMENT_SIZE, COLLECTIONS_DIR
from db.client import MongoDBClient


def retrieve(std_id: int, project_name: str, query: str, top_k: int = 5):
    """
    Embed query, then compute cosine similarity against stored segments.
    Returns top_k segments with metadata including page numbers.
    """
    db = MongoDBClient()
    print(type(db))
    segments_col = db.select_collection("documents_segments")
    segments = list(segments_col.find({"std_id": std_id, "project_name": project_name}))
    if not segments:
        return []

    # Embed query
    client = genai.Client(api_key=GOOGLE_API_KEY)
    resp = client.models.embed_content(
        model=GEMINI_EMB_MODEL,
        contents=[query],
        config=EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    q_vec = np.array(resp.embeddings[0].values, dtype='float32')

    # Compute similarities
    sims = []
    for seg in segments:
        emb = np.array(seg['embedding'], dtype='float32')
        cosine = float(np.dot(q_vec, emb) / (np.linalg.norm(q_vec) * np.linalg.norm(emb)))
        sims.append((cosine, seg))

    sims.sort(key=lambda x: x[0], reverse=True)

    # Return top_k with page info
    results = []
    for score, seg in sims[:top_k]:
        results.append({
            "score": score,
            "file": seg['file_name'],
            "page": seg['page_number'],
            "segment_index": seg['segment_index'],
            "text": seg['text']
        })

    return results
