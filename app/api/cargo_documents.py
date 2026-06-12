import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.cargo_document import DocumentType, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.cargo_document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentVerifyRequest,
)
from app.services import cargo_document_service, cargo_service

router = APIRouter(prefix="/cargo/{cargo_id}/documents", tags=["Cargo Documents"])


@router.post("/", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    cargo_id: int,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.captain, UserRole.driver, UserRole.admin)),
):
    cargo = await cargo_service.get_cargo(session, cargo_id)
    if not cargo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    if current_user.role == UserRole.client and cargo.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo")

    try:
        doc_type = DocumentType(document_type)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document type")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file.pdf")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    with open(file_path, "wb") as f:
        f.write(content)

    doc = await cargo_document_service.upload_document(
        session=session,
        cargo_id=cargo_id,
        document_type=doc_type,
        file_url=file_path,
    )
    return doc


@router.get("/", response_model=list[DocumentResponse])
async def get_documents(
    cargo_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    cargo = await cargo_service.get_cargo(session, cargo_id)
    if not cargo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo not found")
    if current_user.role == UserRole.client and cargo.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your cargo")
    return await cargo_document_service.get_cargo_documents(session, cargo_id)


@router.patch("/{document_id}/verify", response_model=DocumentResponse)
async def verify_document(
    cargo_id: int,
    document_id: int,
    body: DocumentVerifyRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.admin, UserRole.super_admin, UserRole.parking_manager, UserRole.governance)),
):
    doc = await cargo_document_service.verify_document(
        session=session,
        document_id=document_id,
        verification_status=body.verification_status,
        verified_by=current_user.id,
        flagged_reason=body.flagged_reason,
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc
