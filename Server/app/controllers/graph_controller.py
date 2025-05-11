from bson import ObjectId
from fastapi import HTTPException
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from typing import Optional, Dict, Any

class GraphController:
    def __init__(self, db):
        """Initialize the controller with database connection"""
        self.db = db
        self.collection = self.db["test1"]

    async def get_graph_by_id(self, id: str) -> Dict[str, Any]:
        """
        Retrieve a specific graph document by its ObjectId
        """
        try:
            # Convert string ID to ObjectId
            obj_id = ObjectId(id)

            # Query the document
            document = await self.collection.find_one({"_id": obj_id})

            if document is None:
                raise HTTPException(status_code=404, detail=f"Graph with id {id} not found")

            # Convert ObjectId to string for JSON serialization
            document["_id"] = str(document["_id"])

            return document

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid ObjectId format: {id}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

    async def get_all_graphs(self, skip: int = 0, limit: int = 10) -> list:
        """
        Retrieve multiple graph documents with pagination
        """
        try:
            cursor = self.collection.find().skip(skip).limit(limit)
            documents = await cursor.to_list(length=limit)

            # Convert ObjectId to string for JSON serialization
            for doc in documents:
                doc["_id"] = str(doc["_id"])

            return documents

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            raise HTTPException(status_code=503, detail=f"Database connection error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
