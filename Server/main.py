from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import os
import importlib.util
import sys
from dotenv import load_dotenv
from app.routers import lens, testdb_router, upload
from app.db.mongodb import get_mongo_client
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from pydantic import BaseModel

# Add the parent directory to sys.path to allow imports from src
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.agents.keywords_finder_agent.agent import call_agent

# Load environment variables from .env file
load_dotenv()

# Get MongoDB password from environment variable
mongodb_password = os.getenv("MONGODB_PASSWORD")

uri = f"mongodb+srv://yuiwatanabe:{mongodb_password}@cluster0.16mwq9n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Create a new client and connect to the server
mongo_client = MongoClient(uri, server_api=ServerApi('1'))
db_name = "testdb"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client[db_name]
keywords_collection = db['keywords']  # Collection for storing keywords/topics

app = FastAPI(title="Keywords Finder API")

class TextRequest(BaseModel):
    text: str

class StudyRequest(BaseModel):
    keyword: str

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Edu-25 API")

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# app.include_router(users.router)
app.include_router(lens.router)
app.include_router(testdb_router.router)

app.include_router(upload.router)

# Try to import graph_router if it exists
try:
    from app.routers import graph_router
    app.include_router(graph_router.router)
    logger.info("Successfully loaded graph_router")
except ImportError:
    logger.warning("graph_router module not found, specific graph endpoint not available")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Edu-25 API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/ping")
async def ping():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return {
        "status": "success",
        "message": "pong",
        "timestamp": current_time
    }

@app.on_event("startup")
async def startup_db_client():
    # Initialize MongoDB connection on startup with proper error handling
    logger.info("Starting application...")
    try:
        # Log MongoDB connection info but hide credentials
        mongo_uri = os.environ.get("MONGODB_URI", "")
        db_name = os.environ.get("MONGODB_DB_NAME", "")

        if mongo_uri:
            uri_parts = mongo_uri.split("@")
            if len(uri_parts) > 1:
                # Hide username and password in logs
                masked_uri = f"...@{uri_parts[-1]}"
                logger.info(f"Using MongoDB URI: {masked_uri}")
            else:
                logger.info(f"Using MongoDB URI: {mongo_uri}")

        if db_name:
            logger.info(f"Using database: {db_name}")

        client = get_mongo_client()
        if client:
            logger.info("MongoDB connection established successfully")
        else:
            logger.warning("MongoDB connection failed, but server will start anyway")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        logger.warning("Continuing startup despite errors")


@app.post("/keywords")
async def extract_keywords(request: TextRequest):
    """
    Extract keywords from the provided text using the agent
    """
    try:
        result = call_agent(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling agent: {str(e)}")

@app.post("/simulate-study")
async def simulate_study(request: StudyRequest):
    """
    Simulate studying a keyword by increasing its knowledge level in the database
    """
    try:
        # Connect to MongoDB

        # Default to using the keywords collection
        keyword = keywords_collection.find_one({"keyword": request.keyword})

        # Find the keyword in the database        
        current_level = keyword.get("knowledge_level", 0)
        new_level = min(current_level + 0.25, 1.0)
        
        # Update the knowledge level in the database
        result = keywords_collection.update_one(
            {"keyword": request.keyword},
            {"$set": {"knowledge_level": new_level}}
        )
        return {"success": True, "new_level": keywords_collection.find_one({"keyword": request.keyword})['knowledge_level']}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating knowledge level: {str(e)}")
    finally:
        # Ensure the MongoDB connection is closed
        if 'mongo_client' in locals():
            mongo_client.close()


@app.on_event("shutdown")
async def shutdown_db_client():
    # Close MongoDB connection on shutdown
    logger.info("Shutting down application...")
    client = get_mongo_client()
    if client:
        client.close()
        logger.info("MongoDB connection closed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
