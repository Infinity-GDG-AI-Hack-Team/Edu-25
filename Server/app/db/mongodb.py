from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
import logging
from typing import Optional
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# MongoDB connection using environment variables
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("MONGODB_DB_NAME", "edu25_db")
MONGO_CONNECT_TIMEOUT = 5000  # 5 seconds timeout

logger.info(f"Using MongoDB URI: {MONGO_URI[:20]}...")  # Log only the beginning for security
logger.info(f"Using database name: {DB_NAME}")

_mongo_client: Optional[MongoClient] = None
_db: Optional[Database] = None

def get_mongo_client() -> Optional[MongoClient]:
    """
    Get or create a MongoDB client connection with error handling
    """
    global _mongo_client
    if _mongo_client is None:
        try:
            logger.info(f"Attempting to connect to MongoDB...")
            _mongo_client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=MONGO_CONNECT_TIMEOUT
            )
            # Test the connection
            _mongo_client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.warning(f"Failed to connect to MongoDB: {e}")
            logger.warning("Some features requiring database access will not work")
            # Don't set _mongo_client to None here, keep it as None
            return None
    return _mongo_client

def get_database() -> Optional[Database]:
    """
    Get the MongoDB database instance with error handling
    """
    global _db
    if _db is None:
        client = get_mongo_client()
        if client:
            _db = client[DB_NAME]
            logger.info(f"Using database: {DB_NAME}")
        else:
            logger.warning("Cannot access database: MongoDB connection not available")
            return None
    return _db
