import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# Load environment variables from .env file
load_dotenv()

# Get MongoDB password from environment variable
mongodb_password = os.getenv("MONGODB_PASSWORD")

# MongoDB Atlas connection details
uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
collection_name = "test0"
index_name = "semantic_name1"

# Connect to MongoDB Atlas
client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
collection = db[collection_name]

# Define the vector search index configuration
vector_index_config = {
    "name": index_name,
    "definition": {
        "mappings": {
            "dynamic": True,
            "fields": {
                "embedding": {
                    "type": "knnVector",
                    "dimensions": 768,  # Gemini embedding dimensions, adjust if using a different model
                    "similarity": "cosine"
                }
            }
        }
    }
}

# Create the vector search index
print("Setting up vector search index...")
try:
    # Delete existing index if it exists
    try:
        print(f"Attempting to delete existing index '{index_name}'...")
        collection.drop_search_index(index_name)
        print(f"Successfully deleted existing index '{index_name}'")
    except Exception as e:
        print(f"Note: {str(e)}")

    # Check if collection exists, if not create it
    if collection_name not in db.list_collection_names():
        print(f"Collection '{collection_name}' doesn't exist yet, creating it...")
        db.create_collection(collection_name)
        print(f"Collection '{collection_name}' created.")

    # Create the search index
    print("Creating new vector search index...")
    collection.create_search_index(vector_index_config)
    print(f"Vector search index '{index_name}' created successfully.")
    
    print("Vector search index setup complete")
except Exception as e:
    print(f"Error during vector search index setup: {e}")