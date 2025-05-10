from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Annotated, Any
from datetime import datetime
from bson import ObjectId
from pydantic_core import core_schema

class PyObjectId(ObjectId):
    """
    Custom ObjectId type for Pydantic models, compatible with Pydantic v2
    """
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        """
        Define the Pydantic core schema for PyObjectId
        """
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ]),
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class UserBase(BaseModel):
    name: str
    surname: str
    email: EmailStr

class UserCreate(UserBase):
    pass

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = {
        "populate_by_name": True,  # New name for allow_population_by_field_name
        "json_encoders": {ObjectId: str},
        "arbitrary_types_allowed": True
    }

class User(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "json_encoders": {ObjectId: str}
    }
