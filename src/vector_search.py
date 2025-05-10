import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import pprint

# Load environment variables from .env file
load_dotenv()

# Get MongoDB password and Google API key from environment variables
mongodb_password = os.getenv("MONGODB_PASSWORD")
google_api_key = os.getenv("GOOGLE_API_KEY")

# MongoDB Atlas connection details
uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
collection_name = "test3"  # Changed from "test2" to "test3" to match add_documents.py

# Connect to MongoDB Atlas
client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
collection = db[collection_name]

def get_embedding(text):
    """Generate embedding for a single text using Google's Gemini model."""
    # Initialize the embedding model
    embedding_model = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=google_api_key
    )
    
    # Generate embedding
    embedding = embedding_model.embed_query(text)
    
    return embedding

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
                "limit": 5
            }
        }, {
            "$project": {
                "_id": 0,
                "text": 1
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
    results = get_query_results("dog")
    print("Search results:")
    pprint.pprint(results)