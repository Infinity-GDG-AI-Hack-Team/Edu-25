from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from pydantic import BaseModel
from typing import List

router = APIRouter(
    tags=["lens"],
    responses={404: {"description": "Not found"}}
)

class State(BaseModel):
    state: Dict[str, Any]

class MessagePart(BaseModel):
    text: str

class Message(BaseModel):
    role: str
    parts: List[MessagePart]

class RunRequest(BaseModel):
    app_name: str
    user_id: str
    session_id: str
    new_message: Message

# Dictionary to store session states (in production, use a proper database)
session_states: Dict[str, Dict[str, Any]] = {}

@router.post("/apps/keywords_finder/users/{user_id}/sessions/{session_id}")
async def update_session_state(
    user_id: str,
    session_id: str,
    state: State
):
    """
    Update the session state for a specific user and session
    """
    # In a production environment, this would be stored in a database
    key = f"{user_id}:{session_id}"
    session_states[key] = state.state

    return {
        "status": "success",
        "message": f"Session state updated for user {user_id}, session {session_id}"
    }

@router.post("/run")
async def run_lens_processing(request: RunRequest):
    """
    Process a new message with the lens functionality
    """
    # Validate if the app exists
    if request.app_name != "keywords_finder":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"App {request.app_name} not supported"
        )

    # Get session state
    key = f"{request.user_id}:{request.session_id}"
    state = session_states.get(key, {})

    # Process the message
    # This is where you would integrate with your actual processing logic
    # For example, calling your keywords_finder code

    # For demonstration, just extracting the text from the message
    message_text = ""
    if request.new_message.parts:
        message_text = request.new_message.parts[0].text if request.new_message.parts[0].text else ""

    # Return a response
    return {
        "status": "success",
        "message": "Message processed successfully",
        "app_name": request.app_name,
        "user_id": request.user_id,
        "session_id": request.session_id,
        "processed_text": message_text,
        "state": state
    }
