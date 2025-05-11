from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
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
TEST_DB_NAME = "testdb"
MONGO_CONNECT_TIMEOUT = 5000  # 5 seconds timeout

logger.info(f"Using MongoDB URI: {MONGO_URI[:20]}...")
logger.info(f"Test database name: {TEST_DB_NAME}")

# Motor async client
_motor_client: Optional[AsyncIOMotorClient] = None
_testdb: Optional[AsyncIOMotorDatabase] = None

def get_motor_client() -> AsyncIOMotorClient:
    """
    Get or create a Motor async MongoDB client connection
    """
    global _motor_client
    if _motor_client is None:
        logger.info(f"Creating Motor async MongoDB client connection...")
        _motor_client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=MONGO_CONNECT_TIMEOUT
        )
    return _motor_client

async def get_testdb() -> AsyncIOMotorDatabase:
    """
    Get the testdb MongoDB database instance
    """
    client = get_motor_client()
    return client[TEST_DB_NAME]
