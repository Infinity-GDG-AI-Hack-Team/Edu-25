from google.adk.agents import Agent, SequentialAgent
from pydantic import BaseModel, Field
from typing import List
import json
import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from google import genai
from datetime import datetime

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
    """Schema for keywords extraction response"""
    keywords: List[str] = Field(description="List of extracted keywords")


def generate_embedding(text):
    """Generate embedding for a single text using Google's Gemini model."""
    # Initialize the genai client
    genai_client = genai.Client(api_key=google_api_key)
    
    # Generate embedding
    result = genai_client.models.embed_content(
        model="models/text-embedding-004",
        contents=text
    )
    
    return result.embeddings[0].values


def save_keywords_to_db(keywords_json: str) -> str:
    """
    Function to save keywords to MongoDB.
    Takes a List of keywords and saves them with their embeddings.
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
    documents = []
    
    for keyword in keywords:
        # Generate embedding for the keyword
        embedding = generate_embedding(keyword)
        
        # Create document with keyword and its embedding
        doc = {
            # "_id": i,
            "keyword": keyword,
            "embedding": embedding,
            "knowledge_level": 0.0,  # How much the keyword is known from 0 to 1
            # "timestamp": datetime.now()
        }
        documents.append(doc)
    print(f"Documents: {documents}")
    # Insert documents into the keywords collection
    if documents:
        result = keywords_collection.insert_many(documents)
        return len(result.inserted_ids)
    return 0

# Create extraction agent
extract_keywords_agent = Agent(
    model='gemini-2.0-flash-001',
    name='extract_keywords_agent',
    description='An agent that extracts important keywords from text.',
    instruction='Extract the most important keywords from the provided text. Return only the keywords as a comma-separated list.',
    output_schema=KeywordsResponse, # Enforce JSON output
    output_key="extracted_keywords"  # Store result in state['found_capital']
)

# Create save keywords agent
save_keywords_agent = Agent(
    model='gemini-2.0-flash-001',
    name='save_keywords_agent',
    description='An agent that saves keywords to the database.',
    instruction='Save the extracted keywords to the database.',
    tools=[save_keywords_to_db]
)

# Create sequential agent that combines both agents
root_agent = SequentialAgent(
    name='keywords_sequential_agent',
    description='A sequential agent that extracts keywords and saves them to the database.',
    sub_agents=[extract_keywords_agent, save_keywords_agent]
)
