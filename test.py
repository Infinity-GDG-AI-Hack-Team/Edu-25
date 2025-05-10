import getpass
import os
import time
from langchain_mongodb.vectorstores import MongoDBAtlasVectorSearch
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def main():
    # Get credentials from environment variables
    mongodb_password = os.getenv("MONGODB_PASSWORD")
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    # Print confirmation (remove in production)
    print("Environment variables loaded successfully")
    print(f"MongoDB Password: {'*' * len(mongodb_password) if mongodb_password else 'Not found'}")
    print(f"Google API Key: {'*' * 8 + google_api_key[-4:] if google_api_key else 'Not found'}")
    
    print("Hello, World!")

    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-exp-03-07")
    print("Hello, World!")

    index_name = "semantic_name1"

    # Define the index configuration for vector search
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

    # MongoDB connection details
    connection_string = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    db_name = "testdb"
    collection_name = "test0"
    namespace = f"{db_name}.{collection_name}"

    # Instantiate the vector store using your MongoDB connection string
    print("Creating vector store...")
    vector_store = MongoDBAtlasVectorSearch.from_connection_string(
        connection_string=connection_string,
        namespace=namespace,
        embedding=embeddings,
        index_name="semantic_name",
        text_key="text",
        embedding_key="embedding",
        create_index=True,  # Automatically creates the vector index if it doesn't exist
        index_schema=vector_index_config,  # Using our predefined index schema
    )

    # Wait for a moment to ensure the index is propagated
    print("Waiting for index to be fully propagated...")
    time.sleep(5)

    # Use the vector store as a retriever
    retriever = vector_store.as_retriever()
    # Define your query
    query = "dog"
    # Print results
    print("Running search query...")

    try:
        documents = retriever.invoke(query)
        print(f"Retrieved {len(documents)} documents")
        for doc in documents:
           print(doc)
    except Exception as e:
        print(f"Error during search: {e}")
        
        # Try to add a sample document to make sure there's data to search
        print("Adding a sample document to the collection...")
        sample_texts = ["Dogs are friendly pets that love to play and go for walks.",
                       "Cats are independent animals that enjoy napping and hunting.",
                       "Parrots are colorful birds known for their ability to mimic human speech."]
        
        try:
            vector_store.add_texts(sample_texts)
            print("Sample documents added successfully. Trying search again...")
            
            # Wait a moment for the documents to be indexed
            time.sleep(5)
            
            # Try the search again
            documents = retriever.invoke(query)
            print(f"Retrieved {len(documents)} documents")
            for doc in documents:
               print(doc)
        except Exception as e2:
            print(f"Error adding documents or searching again: {e2}")

if __name__ == "__main__":
    main()