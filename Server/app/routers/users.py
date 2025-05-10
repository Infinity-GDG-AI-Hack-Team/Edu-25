from fastapi import APIRouter, HTTPException, Depends, status
from typing import List

from ..models.user import User, UserCreate
from ..controllers.user_controller import UserController

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

def get_user_controller() -> UserController:
    """
    Dependency for getting user controller
    """
    return UserController()

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    controller: UserController = Depends(get_user_controller)
):
    """
    Create a new user
    """
    return controller.create_user(user)

@router.get("/", response_model=List[User])
async def read_users(
    controller: UserController = Depends(get_user_controller)
):
    """
    Get all users
    """
    return controller.get_all_users()

@router.get("/{user_id}", response_model=User)
async def read_user(
    user_id: str,
    controller: UserController = Depends(get_user_controller)
):
    """
    Get a user by ID
    """
    return controller.get_user_by_id(user_id)

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserCreate,
    controller: UserController = Depends(get_user_controller)
):
    """
    Update a user
    """
    return controller.update_user(user_id, user_update)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    controller: UserController = Depends(get_user_controller)
):
    """
    Delete a user
    """
    controller.delete_user(user_id)
    return None
