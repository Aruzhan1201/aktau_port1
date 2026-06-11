import csv
import io
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])


class GenerateReport(BaseModel):
    port: str = "aktau"
    report_type: str = "performance"
    title: str = ""
    period_days: int = 30


@router.get("/export")
async def export_report(
    port: str = Query("aktau"),
    report_type: str = Query("performance"),
    format: str = Query("csv"),
    days: int = Query(30),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=days)
    period_end = now

    if report_type == "performance":
        data = await report_service.generate_performance_report(session, port, period_start, period_end, 0)
    elif report_type == "safety":
        data = await report_service.generate_safety_report(session, port, period_start, period_end)
    elif report_type == "throughput":
        data = await report_service.generate_throughput_report(session, port, period_start, period_end)
    elif report_type == "delays":
        data = await report_service.generate_delay_report(session, port, period_start, period_end)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")

    if format == "csv":
        return _export_csv(data, f"{report_type}_{port}")
    elif format == "json":
        return data
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use csv or json.")


@router.post("/generate")
async def generate_report(
    body: GenerateReport,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=body.period_days)
    period_end = now

    if body.report_type == "performance":
        data = await report_service.generate_performance_report(session, body.port, period_start, period_end, user.id)
    elif body.report_type == "safety":
        data = await report_service.generate_safety_report(session, body.port, period_start, period_end)
    elif body.report_type == "throughput":
        data = await report_service.generate_throughput_report(session, body.port, period_start, period_end)
    elif body.report_type == "delays":
        data = await report_service.generate_delay_report(session, body.port, period_start, period_end)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {body.report_type}")

    title = body.title or f"{body.report_type.title()} Report - {body.port.title()} - {period_start.date()}"
    report = await report_service.save_report(
        session, body.port, body.report_type, title,
        {"period_days": body.period_days, "period_start": period_start.isoformat(), "period_end": period_end.isoformat()},
        data, user.id,
    )
    return {"id": report.id, "title": report.title, "created_at": report.created_at.isoformat(), "data": data}


@router.get("/saved")
async def list_saved_reports(
    port: str | None = Query(None),
    report_type: str | None = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.governance, UserRole.admin, UserRole.super_admin)),
):
    reports = await report_service.get_saved_reports(session, port, report_type, skip, limit)
    return [
        {
            "id": r.id,
            "port": r.port,
            "report_type": r.report_type,
            "title": r.title,
            "generated_by": r.generated_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


def _export_csv(data: dict, filename: str) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)

    def _flatten(d: dict, prefix: str = ""):
        rows = []
        for k, v in d.items():
            key = f"{prefix}{k}" if prefix else k
            if isinstance(v, dict):
                rows.extend(_flatten(v, f"{key}_"))
            elif isinstance(v, list):
                rows.append([key, str(v)])
            else:
                rows.append([key, str(v)])
        return rows

    rows = _flatten(data)
    writer.writerow(["Metric", "Value"])
    for row in rows:
        writer.writerow(row)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
    )
