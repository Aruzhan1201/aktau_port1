from datetime import datetime

from pydantic import BaseModel, Field


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    tax_id: str | None = Field(None, max_length=100)
    address: str | None = Field(None, max_length=500)
    phone: str | None = Field(None, max_length=50)
    email: str | None = Field(None, max_length=255)


class CompanyResponse(BaseModel):
    id: int
    name: str
    tax_id: str | None
    address: str | None
    phone: str | None
    email: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
