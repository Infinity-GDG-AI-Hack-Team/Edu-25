from datetime import datetime
from typing import Dict, Any, Optional, List
from bson import ObjectId

from ..db.mongodb import get_database
from ..models.user import UserInDB
from .base_repository import BaseRepository

class UserRepository(BaseRepository[UserInDB]):
    """
    Repository for user-related database operations
    """

    def __init__(self):
        db = get_database()
        collection = db["users"]
        super().__init__(collection, UserInDB)

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Find a user by email address
        """
        return self.find_one({"email": email})

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user with timestamps
        """
        now = datetime.now()
        user_data["created_at"] = now
        user_data["updated_at"] = now

        result = self.create(user_data)

        # Return the created user
        return self.find_by_id(str(result.inserted_id))

    def update_user(self, id: str, user_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a user and set the updated_at timestamp
        """
        # Set updated timestamp
        user_data["updated_at"] = datetime.now()

        # Update the user
        result = self.update(id, user_data)

        # Return the updated user if update was successful
        if result.modified_count > 0 or result.matched_count > 0:
            return self.find_by_id(id)
        return None

    def find_all_users(self) -> List[Dict[str, Any]]:
        """
        Get all users with formatted IDs
        """
        users = self.find_all()
        for user in users:
            user["id"] = str(user["_id"])
        return users
