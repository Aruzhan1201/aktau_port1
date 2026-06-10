from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.user import User, UserRole
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.services import assignment_service

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    body: AssignmentCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.parking_manager, UserRole.admin)),
):
    assignment = await assignment_service.create_assignment(
        session=session,
        ship_id=body.ship_id,
        berth_id=body.berth_id,
        cargo_id=body.cargo_id,
        arrival_time=body.arrival_time,
        departure_time=body.departure_time,
    )
    return assignment


@router.get("/", response_model=list[AssignmentResponse])
async def list_assignments(
    ship_id: int | None = Query(None),
    berth_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
):
    items, total = await assignment_service.list_assignments(
        session, ship_id=ship_id, berth_id=berth_id, skip=skip, limit=limit
    )
    return items
