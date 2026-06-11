from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.cargo_document import CargoDocument
from app.models.user import User, UserRole
from app.services import excel_report_service, traffic_service

router = APIRouter(prefix="/governance", tags=["Governance"])


@router.get("/reports/excel")
async def export_excel_report(
    days: int = Query(30, ge=1, le=365),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    now = datetime.now(timezone.utc)
    if date_from:
        try:
            start = datetime.fromisoformat(date_from)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format. Use ISO format.")
    else:
        start = now - timedelta(days=days)

    if date_to:
        try:
            end = datetime.fromisoformat(date_to)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format. Use ISO format.")
    else:
        end = now

    output = await excel_report_service.generate_excel_report(session, start, end)
    filename = f"aktau_port_report_{start.date()}_{end.date()}.xlsx"
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/documents")
async def get_governance_documents(
    status: str | None = Query(None, description="Filter by verification_status"),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    query = (
        select(CargoDocument)
        .options(joinedload(CargoDocument.cargo))
        .order_by(CargoDocument.uploaded_at.desc())
    )
    if status:
        query = query.where(CargoDocument.verification_status == status)
    result = await session.execute(query)
    docs = result.unique().scalars().all()
    return [
        {
            "id": d.id,
            "cargo_id": d.cargo_id,
            "document_type": d.document_type.value,
            "verification_status": d.verification_status.value,
            "flagged_reason": d.flagged_reason,
            "file_url": d.file_url,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "verified_at": d.verified_at.isoformat() if d.verified_at else None,
            "cargo_origin": d.cargo.origin if d.cargo else None,
            "cargo_destination": d.cargo.destination if d.cargo else None,
        }
        for d in docs
    ]


@router.get("/traffic")
async def get_traffic_analytics(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    return await traffic_service.get_traffic_overview(session)
