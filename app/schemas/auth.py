from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: str | None = Field(None, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.client
    company_id: int | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    role: UserRole


class UserResponse(BaseModel):
    id: int
    company_id: int | None
    role: UserRole
    name: str
    phone: str | None
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
