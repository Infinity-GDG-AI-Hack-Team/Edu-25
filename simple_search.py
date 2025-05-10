import os
from dotenv import load_dotenv
from langchain_mongodb.vectorstores import MongoDBAtlasVectorSearch
from langchain_google_genai import GoogleGenerativeAIEmbeddings

# Load environment variables from .env file
load_dotenv()

# Get credentials from environment variables
mongodb_password = os.getenv("MONGODB_PASSWORD")
google_api_key = os.getenv("GOOGLE_API_KEY")

# Set Google API key
os.environ["GOOGLE_API_KEY"] = google_api_key

# Initialize embeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-exp-03-07")

# MongoDB connection details
connection_string = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
db_name = "testdb"
collection_name = "test0"
namespace = f"{db_name}.{collection_name}"

# Connect to the existing vector store
vector_store = MongoDBAtlasVectorSearch.from_connection_string(
    connection_string=connection_string,
    namespace=namespace,
    embedding=embeddings,
    index_name="semantic_name",
    text_key="text",
    embedding_key="embedding"
)

# Search for "dog"
query = "dog"
print(f"Searching for: '{query}'")

# Get the retriever and perform the search
retriever = vector_store.as_retriever()
documents = retriever.invoke(query)

# Display results
print(f"\nFound {len(documents)} matching documents:")
for i, doc in enumerate(documents, 1):
    print(f"\n--- Document {i} ---")
    print(f"Content: {doc.page_content}")
    if doc.metadata:
        print(f"Metadata: {doc.metadata}")