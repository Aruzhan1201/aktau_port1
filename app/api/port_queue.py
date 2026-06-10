from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.schemas.port_queue import QueueItemResponse, QueueListResponse
from app.services import port_queue_service

router = APIRouter(prefix="/queue", tags=["Port Queue"])


@router.get("/", response_model=QueueListResponse)
async def get_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    items, total, waiting = await port_queue_service.get_queue(
        session, skip=skip, limit=limit
    )
    return QueueListResponse(total=total, waiting=waiting, items=items)


@router.post("/process")
async def process_queue(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    result = await port_queue_service.process_next(session)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue is empty")
    return result
