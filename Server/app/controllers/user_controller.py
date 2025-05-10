from fastapi import HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..repositories.user_repository import UserRepository
from ..models.user import User, UserCreate, UserInDB

class UserController:
    """
    Controller for handling user-related business logic
    """

    def __init__(self):
        self.repository = UserRepository()

    def get_all_users(self) -> List[User]:
        """
        Get all users
        """
        users = self.repository.find_all_users()

        # Convert to User model
        return [
            User(
                id=str(user["_id"]),
                name=user["name"],
                surname=user["surname"],
                email=user["email"],
                created_at=user["created_at"],
                updated_at=user["updated_at"]
            )
            for user in users
        ]

    def get_user_by_id(self, user_id: str) -> User:
        """
        Get a user by ID
        """
        user_doc = self.repository.find_by_id(user_id)

        if user_doc is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )

        return User(
            id=str(user_doc["_id"]),
            name=user_doc["name"],
            surname=user_doc["surname"],
            email=user_doc["email"],
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"]
        )

    def create_user(self, user_create: UserCreate) -> User:
        """
        Create a new user
        """
        # Check if email already exists
        existing_user = self.repository.find_by_email(user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Prepare user document
        user_dict = UserInDB(**user_create.dict()).dict(by_alias=True)

        # Create user in repository
        created_user = self.repository.create_user(user_dict)

        if created_user is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        return User(
            id=str(created_user["_id"]),
            name=created_user["name"],
            surname=created_user["surname"],
            email=created_user["email"],
            created_at=created_user["created_at"],
            updated_at=created_user["updated_at"]
        )

    def update_user(self, user_id: str, user_update: UserCreate) -> User:
        """
        Update a user
        """
        # Check if user exists
        existing_user = self.repository.find_by_id(user_id)
        if existing_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )

        # Check if email is already used by another user
        if existing_user["email"] != user_update.email:
            email_user = self.repository.find_by_email(user_update.email)
            if email_user and str(email_user["_id"]) != user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered with another account"
                )

        # Update user
        update_data = user_update.dict()
        updated_user = self.repository.update_user(user_id, update_data)

        if updated_user is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user"
            )

        return User(
            id=str(updated_user["_id"]),
            name=updated_user["name"],
            surname=updated_user["surname"],
            email=updated_user["email"],
            created_at=updated_user["created_at"],
            updated_at=updated_user["updated_at"]
        )

    def delete_user(self, user_id: str) -> None:
        """
        Delete a user
        """
        result = self.repository.delete(user_id)

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
