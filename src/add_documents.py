import os
from dotenv import load_dotenv
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from google import genai
from config import GOOGLE_API_KEY


# Function to create embedding with Gemini
def generate_embeddings(texts):
    """Generate embeddings for a list of texts using Google's Gemini model."""
    # Initialize the genai client
    genai_client = genai.Client(api_key=GOOGLE_API_KEY)
    
    # Generate embeddings
    embeddings = []
    for text in texts:
        result = genai_client.models.embed_content(
            model="gemini-embedding-exp-03-07",
            contents=text
        )

        # Extract the values from the ContentEmbedding object
        embedding_values = result.embeddings[0].values
        embeddings.append(embedding_values)
    
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


