from google.adk.agents import Agent, SequentialAgent, ParallelAgent
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import json
import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from google import genai
from datetime import datetime
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

import sys

# Add the parent directory to sys.path to import modules from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
# Fix the import statement to use the correct path
from src.vector_search import get_query_results, get_known_topics

# Load environment variables
load_dotenv("../../.env")

APP_NAME="graph_sequential_agent"
USER_ID="user1234"
SESSION_ID="1234"

# Get MongoDB password and Google API key from environment variables
mongodb_password = os.getenv("MONGODB_PASSWORD")
google_api_key = os.getenv("GOOGLE_API_KEY")

# MongoDB Atlas connection details
uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
keywords_collection_name = "keywords"

# Directory for saving responses
RESPONSES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "responses")
# Create the directory if it doesn't exist
os.makedirs(RESPONSES_DIR, exist_ok=True)

# Connect to MongoDB Atlas
client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
keywords_collection = db[keywords_collection_name]

class KeywordsResponse(BaseModel):
    """Schema for the response of the keywords extraction agent.
    Summaries are also included for each keyword. the summaries can replace the keywords in the text."""
    keywords: List[str] = Field(description="List of extracted keywords")
    summaries: List[str] = Field(description="List of summaries for each keyword")


def generate_embeddings(texts):
    """Generate embedding for a single text using Google's Gemini model."""
    # Initialize the genai client
    genai_client = genai.Client(api_key=google_api_key)

    # Generate embedding
    result = genai_client.models.embed_content(
        model="models/text-embedding-004",
        contents=texts
    )

    return [emb.values for emb in result.embeddings]


def save_keywords_to_db(keywords_json: str) -> str:
    """
    Function to save keywords to MongoDB.
    Takes a List of keywords and saves them with their embeddings.
    The input is a list.
    Returns a JSON string with the result.
    """
    try:
        # Parse the JSON string to get the keywords
        keywords = json.loads(keywords_json)

        # Save keywords with embeddings to MongoDB
        saved_count = save_keywords_with_embeddings(keywords)
        # print(f"Saved {saved_count} keywords with embeddings to MongoDB")

        # Return the original keywords with a success message
        return json.dumps({
            "success": True,
            "saved_count": saved_count,
            "keywords": keywords
        })
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": str(e),
            "keywords": []
        })


def save_keywords_with_embeddings(keywords):
    """Save keywords and their embeddings to MongoDB."""
    key_doc = []
    key_doc_insert = []
    all_related_documents = []
    embeddings = generate_embeddings(keywords)

    for keyword, embedding in zip(keywords, embeddings):
        # Check if keyword already exists in the database
        existing_keyword = keywords_collection.find_one({"keyword": keyword})

        # Get the first 3 similar document segments for this keyword
        related_documents = get_query_results(keyword)
        for doc in related_documents:
            del doc["_id"]

        # Create document with keyword, its embedding, and related documents
        doc = {
            "keyword": keyword,
            "embedding": embedding,
            "knowledge_level": 0.0,  # How much the keyword is known from 0 to 1
            # "related_documents": related_documents,  # Store the first 3 similar documents
            # "created_at": datetime.now()
        }
        if not existing_keyword:
            key_doc_insert.append(doc)
        else:
            doc["knowledge_level"] = existing_keyword["knowledge_level"]
        key_doc.append(doc)
        all_related_documents.append(related_documents)

    # Insert documents into the keywords collection
    if key_doc_insert:
        keywords_collection.insert_many(key_doc_insert)

    docs = []
    for related, doc in zip(all_related_documents, key_doc):
        doc = {
            "keyword": doc["keyword"],
            "knowledge_level": doc["knowledge_level"],
            "related_documents": related,
        }
        docs.append(doc)
    return {"success": True, "result": docs}

class KnowledgeLevelQuery(BaseModel):
    """Schema for the knowledge level threshold parameter."""
    knowledge_level_threshold: float = Field(description="The minimum knowledge level threshold (0.0 to 1.0)")


def get_known_topics_with_threshold() -> str:
    """
    Wrapper function that calls get_known_topics.
    Returns the results in JSON format.
    """
    known_topics = get_known_topics(0.8)
    return json.dumps(known_topics)

# Create extraction agent
extract_keywords_agent = Agent(
    model='gemini-2.0-flash-001',
    name='extract_keywords_agent',
    description='An agent that extracts important keywords from text, generates summaries based on existing knowledge',
    instruction='Extract the most important keywords from the provided text and a summary that explain the keywork meaning. Return only the keywords as a comma-separated list.',
    output_schema=KeywordsResponse, # Enforce JSON output
    output_key="extracted_keywords",
)

get_known_topics_agent = Agent(
    model='gemini-2.0-flash-001',
    name='get_known_topics_agent',
    description='An agent that retrieves known topics from the knowledge base.',
    instruction='Return the known topics from the knowledge base.',
    tools=[get_known_topics_with_threshold],
    input_schema=KnowledgeLevelQuery,
    output_key="known_topics"
)

# Create save keywords agent
save_keywords_agent = Agent(
    model='gemini-2.0-flash-001',
    name='save_keywords_agent',
    description='An agent that saves keywords to the database.',
    instruction='Save the extracted keywords to the database, send only the keywords list.',
    tools=[save_keywords_to_db]
)

# parallel_research_agent = ParallelAgent(
#     name="ParallelWebResearchAgent",
#     sub_agents=[extract_keywords_agent, get_known_topics_agent],
#     description="Runs multiple agents to extract keywords and knowledge levels."
# )


# Create sequential agent that combines both agents
root_agent = SequentialAgent(
    name='keywords_sequential_agent',
    description='A sequential agent that extracts keywords and saves them to the database.',
    sub_agents=[get_known_topics_agent, extract_keywords_agent, save_keywords_agent]
)


# Session and Runner
session_service = InMemorySessionService()
session = session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)


# Agent Interaction
def call_agent(text):
    """
    Helper function to call the agent with a query.
    Handles the sequential flow of the agent pipeline.
    """
    # Ensure the session is initialized every time to avoid stale sessions
    session_service = InMemorySessionService()
    session = session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    runner = Runner(agent=root_agent, app_name=APP_NAME, session_service=session_service)

    content = types.Content(role='user', parts=[types.Part(text=text)])

    # Enable debug logging
    print(f"Starting agent pipeline with input: {text[:100]}...")

    # Get all events from the runner, including intermediate steps
    events = runner.run(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    # Track intermediate responses for debugging
    all_responses = []
    final_response = None

    for i,event in enumerate(events):
        print(f"Event author: {event.author}")
        if hasattr(event.content.parts[0], 'function_response'):
            final_response = event.content.parts[0].function_response
            if event.author == "save_keywords_agent" and final_response is not None:
                try:
                    return json.loads(final_response.response["result"])["saved_count"]["result"]
                except (KeyError, json.JSONDecodeError) as e:
                    print(f"Error processing response: {e}")
                    return {"error": str(e), "raw_response": str(final_response)}

    # Return a default response if nothing was returned from the agent
    return {"error": "No valid response from agent", "status": "failed"}


# Make sure call_agent is properly exported when this module is imported
__all__ = ["call_agent"]
