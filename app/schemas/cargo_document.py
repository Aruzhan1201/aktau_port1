from datetime import datetime

from pydantic import BaseModel, Field

from app.models.cargo_document import DocumentType, VerificationStatus


class DocumentResponse(BaseModel):
    id: int
    cargo_id: int
    document_type: DocumentType
    file_url: str
    verification_status: VerificationStatus
    flagged_reason: str | None
    verified_by: int | None
    uploaded_at: datetime
    verified_at: datetime | None

    model_config = {"from_attributes": True}


class DocumentVerifyRequest(BaseModel):
    verification_status: VerificationStatus
    flagged_reason: str | None = None


class DocumentUploadResponse(BaseModel):
    id: int
    document_type: DocumentType
    file_url: str
    verification_status: VerificationStatus

    model_config = {"from_attributes": True}
