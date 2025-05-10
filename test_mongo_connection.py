#!/usr/bin/env python3
"""
Simple script to test MongoDB connection using credentials from .env
"""
import os
import sys
from dotenv import load_dotenv
import logging
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mongo-test")

def test_connection():
    """Test MongoDB connection using credentials from .env file"""
    # Load environment variables from .env file
    load_dotenv()
    logger.info("Loaded environment variables from .env file")

    # Get MongoDB connection info from environment
    mongo_uri = os.environ.get("MONGODB_URI")
    db_name = os.environ.get("MONGODB_DB_NAME")

    if not mongo_uri:
        logger.error("MONGODB_URI not found in environment variables or .env file")
        sys.exit(1)

    if not db_name:
        logger.error("MONGODB_DB_NAME not found in environment variables or .env file")
        sys.exit(1)

    # Log MongoDB connection info (masked for security)
    uri_parts = mongo_uri.split("@")
    if len(uri_parts) > 1:
        masked_uri = f"...@{uri_parts[-1]}"
        logger.info(f"Using MongoDB URI: {masked_uri}")
    else:
        logger.info(f"Using MongoDB URI: {mongo_uri}")

    logger.info(f"Using database name: {db_name}")

    try:
        # Attempt connection with timeout
        logger.info("Connecting to MongoDB...")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)

        # Verify connection works
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")

        # Try to access the specified database
        db = client[db_name]
        collections = db.list_collection_names()
        logger.info(f"Available collections in {db_name}: {collections if collections else 'No collections found'}")

        # Close connection
        client.close()
        logger.info("Connection closed")
        return True

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        return False
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
