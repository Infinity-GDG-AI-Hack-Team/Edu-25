import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Load environment variables from .env file
load_dotenv()

# Get MongoDB password and Google API key from environment variables
mongodb_password = os.getenv("MONGODB_PASSWORD")
google_api_key = os.getenv("GOOGLE_API_KEY")

# MongoDB Atlas connection details
uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
collection_name = "test3"

# Function to create embedding with Gemini
def generate_embeddings(texts):
    """Generate embeddings for a list of texts using Google's Gemini model."""
    # Initialize the embedding model
    embedding_model = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=google_api_key
    )
    
    # Generate embeddings
    embeddings = [embedding_model.embed_query(text) for text in texts]
    
    return embeddings

# Function to create documents with embeddings
def create_docs_with_embeddings(embeddings, data):
    """Create documents with embeddings for MongoDB."""
    docs = []
    for i, (embedding, text) in enumerate(zip(embeddings, data)):
        doc = {
            "_id": i,
            "text": text,
            "embedding": embedding,
        }
        docs.append(doc)
    return docs

# Connect to MongoDB Atlas
client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
collection = db[collection_name]

# Sample texts to embed
texts = [
    "The cat sat on the mat",
    "Dogs are man's best friend"
]

# Generate embeddings for texts
try:
    print("Generating embeddings...")
    embeddings = generate_embeddings(texts)
    print(f"Successfully generated embeddings for {len(embeddings)} texts")
    
    # Create documents with embeddings
    documents = create_docs_with_embeddings(embeddings, texts)
    
    # Add documents to the collection
    print("Adding documents with embeddings to collection...")
    result = collection.insert_many(documents)
    print(f"Successfully added {len(result.inserted_ids)} documents")
    print(f"Document IDs: {result.inserted_ids}")
except Exception as e:
    print(f"Error in process: {e}")


