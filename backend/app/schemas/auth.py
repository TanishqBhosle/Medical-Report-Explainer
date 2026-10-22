from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
