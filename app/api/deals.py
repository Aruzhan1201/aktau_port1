from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.deal import DealStatus, DealType
from app.models.user import User, UserRole
from app.schemas.deal import DealCreate, DealUpdate, DealResponse, DealListResponse
from app.services import deal_service

router = APIRouter(prefix="/deals", tags=["Deals"])


@router.post("/", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    body: DealCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.driver, UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.create_deal(
        session=session,
        type=body.type,
        client_id=body.client_id,
        driver_id=body.driver_id,
        captain_id=body.captain_id,
        cargo_id=body.cargo_id,
        proposed_price=body.proposed_price,
        currency=body.currency,
        notes=body.notes,
    )
    return deal


@router.get("/", response_model=DealListResponse)
async def list_deals(
    status: DealStatus | None = Query(None),
    type: DealType | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.client:
        items, total = await deal_service.list_deals(
            session, client_id=current_user.id, status=status, type=type, skip=skip, limit=limit
        )
    elif current_user.role == UserRole.driver:
        items, total = await deal_service.list_deals(
            session, driver_id=current_user.id, status=status, type=type, skip=skip, limit=limit
        )
    elif current_user.role == UserRole.captain:
        items, total = await deal_service.list_deals(
            session, captain_id=current_user.id, status=status, type=type, skip=skip, limit=limit
        )
    elif current_user.role in (UserRole.admin, UserRole.super_admin, UserRole.governance, UserRole.port_manager, UserRole.parking_manager):
        items, total = await deal_service.list_deals(session, status=status, type=type, skip=skip, limit=limit)
    else:
        items, total = [], 0
    return DealListResponse(total=total, items=items)


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    deal = await deal_service.get_deal(session, deal_id)
    if not deal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    return deal


@router.put("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: int,
    body: DealUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.driver, UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    updated = await deal_service.update_deal(session, deal_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deal not found")
    return updated


@router.post("/{deal_id}/approve-client")
async def approve_deal_client(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.approve_by_client(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    phone_revealed = deal.phone_revealed_at is not None
    return {
        "message": "Client approved",
        "client_approved": True,
        "driver_approved": deal.driver_approved,
        "captain_approved": deal.captain_approved,
        "status": deal.status.value,
        "phone_revealed": phone_revealed,
    }


@router.post("/{deal_id}/approve-driver")
async def approve_deal_driver(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.driver, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.approve_by_driver(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    phone_revealed = deal.phone_revealed_at is not None
    return {
        "message": "Driver approved",
        "client_approved": deal.client_approved,
        "driver_approved": True,
        "captain_approved": deal.captain_approved,
        "status": deal.status.value,
        "phone_revealed": phone_revealed,
    }


@router.post("/{deal_id}/approve-captain")
async def approve_deal_captain(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.approve_by_captain(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    phone_revealed = deal.phone_revealed_at is not None
    return {
        "message": "Captain approved",
        "client_approved": deal.client_approved,
        "driver_approved": deal.driver_approved,
        "captain_approved": True,
        "status": deal.status.value,
        "phone_revealed": phone_revealed,
    }


@router.post("/{deal_id}/reject-client")
async def reject_deal_client(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.reject_by_client(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Client rejected", "status": deal.status.value}


@router.post("/{deal_id}/reject-driver")
async def reject_deal_driver(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.driver, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.reject_by_driver(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Driver rejected", "status": deal.status.value}


@router.post("/{deal_id}/reject-captain")
async def reject_deal_captain(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    deal = await deal_service.reject_by_captain(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"message": "Captain rejected", "status": deal.status.value}


@router.post("/{deal_id}/complete")
async def complete_deal(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.driver, UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    try:
        deal = await deal_service.complete_deal(session, deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        return {"message": "Deal completed", "status": deal.status.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{deal_id}/cancel")
async def cancel_deal(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.driver, UserRole.captain, UserRole.admin, UserRole.super_admin)),
):
    try:
        deal = await deal_service.cancel_deal(session, deal_id)
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        return {"message": "Deal cancelled", "status": deal.status.value}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{deal_id}/reveal-phone")
async def reveal_deal_phone(
    deal_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    deal = await deal_service.get_deal(session, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.status != DealStatus.both_approved:
        raise HTTPException(status_code=400, detail="Both parties must approve before phone reveal")
    return {
        "client_phone": deal.client.phone if deal.client else None,
        "driver_phone": deal.driver.phone if deal.driver else None,
        "captain_phone": deal.captain.phone if deal.captain else None,
        "revealed_at": deal.phone_revealed_at.isoformat() if deal.phone_revealed_at else None,
    }
