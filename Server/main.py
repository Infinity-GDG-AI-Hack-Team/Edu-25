from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import os
import importlib.util
from dotenv import load_dotenv
from app.routers import users, lens, testdb_router, upload
from app.db.mongodb import get_mongo_client

# Load environment variables from .env file
load_dotenv()

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
app.include_router(users.router)
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
