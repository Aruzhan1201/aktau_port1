from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole
from app.schemas.cargo import AIOrderInput, AIOrderOutput
from app.services import cargo_service
from app.ai.ordering import parse_natural_language_order

router = APIRouter(prefix="/ai-order", tags=["AI Ordering"])


@router.post("/", response_model=AIOrderOutput)
async def ai_order(
    body: AIOrderInput,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.client, UserRole.admin)),
):
    result = await parse_natural_language_order(body.text)

    if result.confidence >= 0.7 and not result.requires_review:
        cargo = await cargo_service.create_cargo(
            session=session,
            client_id=current_user.id,
            company_id=current_user.company_id,
            cargo_type=result.cargo_type or "unknown",
            weight=result.weight or 0,
            origin=result.origin or "",
            destination=result.destination or "",
            eta=None,
            ai_generated=True,
            ai_confidence=result.confidence,
            ai_raw_input=body.text,
        )
        await cargo_service.update_cargo_status(
            session=session,
            cargo_id=cargo.id,
            new_status="approved",
            changed_by=current_user.id,
            notes="Auto-approved by AI (high confidence)",
        )
        result.requires_review = False
    else:
        result.requires_review = True

    return result
