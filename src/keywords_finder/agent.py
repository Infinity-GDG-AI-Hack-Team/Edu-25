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
import sys

# Add the parent directory to sys.path to import modules from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from vector_search import get_query_results, get_known_topics

# Load environment variables
load_dotenv("../.env")

# Get MongoDB password and Google API key from environment variables
mongodb_password = os.getenv("MONGODB_PASSWORD")
google_api_key = os.getenv("GOOGLE_API_KEY")

# MongoDB Atlas connection details
uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
keywords_collection_name = "keywords"


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
    
    return result.embeddings[0].values


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
        print(f"Saved {saved_count} keywords with embeddings to MongoDB")
        
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
    all_related_documents = []
    embeddings = generate_embeddings(keywords)
    
    for keyword,embedding in zip(keywords, embeddings):
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
        key_doc.append(doc)
        all_related_documents.append(related_documents)

    # Insert documents into the keywords collection
    if key_doc:
        keywords_collection.insert_many(key_doc)

    docs = []
    for related,doc in zip(all_related_documents, key_doc):
        doc = {
            "keyword": doc["keyword"],
            "knowledge_level": doc["knowledge_level"],
            "related_documents": related,
        }
        docs.append(doc)
    return {"success": True, "result": docs}

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
    instruction='Return the known topics with a knowledge level greater than 0.8.',
    tools=[get_known_topics],
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
