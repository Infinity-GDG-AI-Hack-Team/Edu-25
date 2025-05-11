import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from google import genai
import pprint

# Load environment variables from .env file
load_dotenv()

# Get MongoDB password and Google API key from environment variables
mongodb_password = os.getenv("MONGODB_PASSWORD")
google_api_key = os.getenv("GOOGLE_API_KEY")

# MongoDB Atlas connection details
uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
collection_name = "documents_segments"  # Changed from "test2" to "test3" to match add_documents.py
keywords_collection_name = "keywords"  # Collection for storing keywords/topics

# Connect to MongoDB Atlas
client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
collection = db[collection_name]
keywords_collection = db[keywords_collection_name]  # Add reference to keywords collection

def get_embedding(text):
    """Generate embedding for a single text using Google's Gemini model."""
    # Initialize the genai client
    genai_client = genai.Client(api_key=google_api_key)
    
    # Generate embedding
    result = genai_client.models.embed_content(
        model="models/text-embedding-004",
        contents=text
    )
    
    return result.embeddings[0].values

def get_known_topics(knowledge_level_threshold: float = 0.8 ):
    """
    Retrieves all topics (keywords) with a knowledge level greater than the specified threshold.
    
    Args:
        knowledge_level_threshold (float): The minimum knowledge level (default: 0.8)
        
    Returns:
        list: A list of dictionaries containing known topics and their details
    """
    query = {"knowledge_level": {"$gt": knowledge_level_threshold}}
    
    # Project only the fields we need
    projection = {
        "_id": 0,
        "keyword": 1,
        "knowledge_level": 1,
        # "created_at": 1
    }
    
    # Find all documents matching the query
    results = keywords_collection.find(query, projection)
    
    # Convert cursor to list
    known_topics = list(results)
    
    return known_topics

# Define a function to run vector search queries
def get_query_results(query):
    """Gets results from a vector search query."""

    query_embedding = get_embedding(query)
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "queryVector": query_embedding,
                "path": "embedding",
                "exact": True,
                "limit": 3
            }
        }, {
            "$project": {
                # "_id": 0,
                "project_name": 1,
                "file_name": 2,
                "page_number": 3,
                "text": 4,
            }
        }
    ]

    results = collection.aggregate(pipeline)

    array_of_results = []
    for doc in results:
        array_of_results.append(doc)
    return array_of_results

if __name__ == "__main__":
    # Test the function with a sample query
    print("Running vector search for")
    results = get_query_results("Machine learning")
    print("Search results:")
    pprint.pprint(results)