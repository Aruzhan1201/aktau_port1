from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cargo_document import (
    CargoDocument,
    DocumentType,
    VerificationStatus,
)


async def upload_document(
    session: AsyncSession,
    cargo_id: int,
    document_type: DocumentType,
    file_url: str,
) -> CargoDocument:
    doc = CargoDocument(
        cargo_id=cargo_id,
        document_type=document_type,
        file_url=file_url,
        verification_status=VerificationStatus.pending,
    )
    session.add(doc)
    await session.flush()
    return doc


async def verify_document(
    session: AsyncSession,
    document_id: int,
    verification_status: VerificationStatus,
    verified_by: int,
    flagged_reason: str | None = None,
) -> CargoDocument | None:
    result = await session.execute(
        select(CargoDocument).where(CargoDocument.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        return None

    doc.verification_status = verification_status
    doc.verified_by = verified_by
    doc.verified_at = datetime.now(timezone.utc)
    if flagged_reason:
        doc.flagged_reason = flagged_reason

    if verification_status == VerificationStatus.flagged:
        from app.models.cargo import Cargo
        cargo_result = await session.execute(
            select(Cargo).where(Cargo.id == doc.cargo_id)
        )
        cargo = cargo_result.scalar_one_or_none()
        if cargo:
            from app.models.cargo import CargoStatus
            cargo.is_flagged = True
            cargo.flag_reason = flagged_reason or "Suspicious document"

    await session.flush()
    return doc


async def get_cargo_documents(
    session: AsyncSession, cargo_id: int
) -> list[CargoDocument]:
    result = await session.execute(
        select(CargoDocument)
        .where(CargoDocument.cargo_id == cargo_id)
        .order_by(CargoDocument.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def check_documents_verified(
    session: AsyncSession, cargo_id: int
) -> bool:
    result = await session.execute(
        select(CargoDocument).where(CargoDocument.cargo_id == cargo_id)
    )
    docs = list(result.scalars().all())
    if not docs:
        return False
    return all(d.verification_status == VerificationStatus.verified for d in docs)
