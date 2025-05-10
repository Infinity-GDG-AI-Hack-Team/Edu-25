import os
import sys
from google import genai
from google.genai.types import HttpOptions, ModelContent, Part, UserContent

from pydantic import BaseModel, Field

# add the parent directory to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from db.client import MongoDBClient
from config import GOOGLE_API_KEY


class StudyGraph(BaseModel):
    """
    Represents a study graph with nodes, edges, and a sequence.
    """
    nodes: list[str] = Field(description="List of topics (nodes) in the study graph.")
    edges: list[tuple[str, str]] = Field(description="List of prerequisite relationships (edges).")
    sequence: list[str] = Field(description="Proposed optimal study sequence.")


def generate_study_graph(std_id: int, project_name: str) -> str:
    """
    Builds a study graph plan by analyzing stored PDF segments for a student.

    Returns a string describing nodes (topics) and edges (dependencies), plus a suggested study sequence.
    """
    db = MongoDBClient()
    segments_col = db.select_collection('documents_segments')
    segments = list(segments_col.find({
        "std_id": std_id,
        "project_name": project_name
    }))
    if not segments:
        return "No content found for this student/project. Please ingest PDFs first."

    # Summarize segment texts into a single context
    context_snippets = []
    for seg in segments:
        snippet = seg['text'][:200].replace("", " ")
        context_snippets.append(f"- {seg['file_name']} (p{seg['page_number']}): {snippet}")
    context = "".join(context_snippets)

    # Prompt the LLM to generate a graph plan
    # client = genai.Client(api_key=GOOGLE_API_KEY)
    client = genai.Client(api_key=GOOGLE_API_KEY, http_options=HttpOptions(api_version="v1"))
    prompt = (
        "You are an expert curriculum designer. Based on the following extracted PDF content snippets, "
        "identify the key topics as nodes, specify prerequisite relationships as edges, "
        "and propose an optimal study sequence. Output in JSON with 'nodes', 'edges', 'sequence'."
        f"Content Snippets:{context}"
    )
    return context

    response = client.models.generate_content(
        model="gemini-2.0-chat",
        contents=context,
        config={
            "response_mime_type": "application/json",
            "response_schema": StudyGraph.schema(),
        },
    )

    return response.text
