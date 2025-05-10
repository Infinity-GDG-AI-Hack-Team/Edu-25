from pymongo import MongoClient
from pymongo.database import Database
import os
from typing import Optional

# MongoDB connection
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.environ.get("DB_NAME", "edu25_db")

_mongo_client: Optional[MongoClient] = None
_db: Optional[Database] = None

def get_mongo_client() -> MongoClient:
    """
    Get or create a MongoDB client connection
    """
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(MONGO_URI)
    return _mongo_client

def get_database() -> Database:
    """
    Get the MongoDB database instance
    """
    global _db
    if _db is None:
        client = get_mongo_client()
        _db = client[DB_NAME]
    return _db
