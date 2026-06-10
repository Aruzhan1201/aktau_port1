from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import RoleChecker, get_current_user
from app.models.user import User, UserRole
from app.schemas.company import CompanyCreate, CompanyResponse, CompanyUpdate
from app.services import company_service

router = APIRouter(prefix="/company", tags=["Companies"])
admin_only = RoleChecker(UserRole.admin)


@router.post("/create", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(admin_only),
):
    company = await company_service.create_company(
        session=session,
        name=body.name,
        tax_id=body.tax_id,
        address=body.address,
        phone=body.phone,
        email=body.email,
    )
    return company


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(RoleChecker(UserRole.admin, UserRole.client)),
):
    company = await company_service.get_company(session, company_id)
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: int,
    body: CompanyUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(admin_only),
):
    updated = await company_service.update_company(session, company_id, body.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return updated


@router.delete("/{company_id}", response_model=CompanyResponse)
async def delete_company(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(admin_only),
):
    deleted = await company_service.delete_company(session, company_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return deleted


@router.get("/", response_model=list[CompanyResponse])
async def list_companies(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(admin_only),
):
    return await company_service.list_companies(session)
