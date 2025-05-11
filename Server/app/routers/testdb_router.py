from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from pymongo import MongoClient
import logging
import os
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# MongoDB connection for testdb specifically
MONGO_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/")
TEST_DB_NAME = "testdb"  # Explicitly use testdb, not the default DB_NAME
MONGO_CONNECT_TIMEOUT = 5000  # 5 seconds timeout

router = APIRouter(
    prefix="/testdb",
    tags=["testdb"],
    responses={404: {"description": "Not found"}},
)

def get_test_collection():
    """Connect to the testdb database and get the test1 collection"""
    try:
        # Create a new client specifically for testdb
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=MONGO_CONNECT_TIMEOUT)

        # Test the connection
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB for testdb")

        # Get the testdb database and test1 collection
        db = client[TEST_DB_NAME]
        collection = db["test1"]

        return collection
    except Exception as e:
        logger.error(f"Failed to connect to testdb database: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error"
        )

@router.get("/data", response_model=List[Dict[str, Any]])
async def get_testdb_data(
    limit: int = Query(10, description="Number of documents to return"),
    skip: int = Query(0, description="Number of documents to skip"),
    filter_field: Optional[str] = Query(None, description="Field name to filter by"),
    filter_value: Optional[str] = Query(None, description="Value to filter by")
):
    """Fetch data from the test1 collection in the testdb database"""
    try:
        collection = get_test_collection()

        # Build query filter if filter parameters are provided
        query_filter = {}
        if filter_field and filter_value:
            query_filter[filter_field] = filter_value

        # Execute the query
        documents = list(collection.find(query_filter).skip(skip).limit(limit))

        # Convert ObjectId to string to make it serializable
        for doc in documents:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])

        return documents

    except Exception as e:
        logger.error(f"Error fetching data from testdb: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data: {str(e)}"
        )

@router.get("/data/{document_id}")
async def get_testdb_document(document_id: str):
    """Fetch a specific document from the test1 collection by its ID"""
    try:
        collection = get_test_collection()

        from bson.objectid import ObjectId

        # Try to convert the string ID to ObjectId
        try:
            obj_id = ObjectId(document_id)
        except Exception:
            # If not a valid ObjectId, try as a string ID
            obj_id = document_id

        document = collection.find_one({"_id": obj_id})

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )

        # Convert ObjectId to string for JSON serialization
        if "_id" in document:
            document["_id"] = str(document["_id"])

        return document

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching document from testdb: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching document: {str(e)}"
        )
