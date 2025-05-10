from typing import Generic, TypeVar, List, Optional, Type, Dict, Any
from bson import ObjectId
from pymongo.collection import Collection
from pymongo.results import InsertOneResult, UpdateResult, DeleteResult

T = TypeVar('T')

class BaseRepository(Generic[T]):
    """
    Base repository interface with common CRUD operations
    """

    def __init__(self, collection: Collection, model_class: Type[T]):
        self.collection = collection
        self.model_class = model_class

    def find_all(self) -> List[Dict[str, Any]]:
        """Get all documents from the collection"""
        return list(self.collection.find())

    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        """Find a document by its ID"""
        try:
            object_id = ObjectId(id)
            return self.collection.find_one({"_id": object_id})
        except:
            return None

    def find_one(self, filter_dict: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a document by custom filter"""
        return self.collection.find_one(filter_dict)

    def find_many(self, filter_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find multiple documents by custom filter"""
        return list(self.collection.find(filter_dict))

    def create(self, data: Dict[str, Any]) -> InsertOneResult:
        """Insert a new document"""
        return self.collection.insert_one(data)

    def update(self, id: str, data: Dict[str, Any]) -> UpdateResult:
        """Update a document by ID"""
        try:
            object_id = ObjectId(id)
            return self.collection.update_one(
                {"_id": object_id},
                {"$set": data}
            )
        except:
            # Return an empty update result if the ID is invalid
            class EmptyUpdateResult:
                @property
                def modified_count(self): return 0
                @property
                def matched_count(self): return 0
                @property
                def upserted_id(self): return None
            return EmptyUpdateResult()

    def delete(self, id: str) -> DeleteResult:
        """Delete a document by ID"""
        try:
            object_id = ObjectId(id)
            return self.collection.delete_one({"_id": object_id})
        except:
            # Return an empty delete result if the ID is invalid
            class EmptyDeleteResult:
                @property
                def deleted_count(self): return 0
                @property
                def raw_result(self): return {}
            return EmptyDeleteResult()
