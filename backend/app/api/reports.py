"""Report generation API endpoints."""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportResponse, ReportListResponse
from app.services.report_generator import generate_daily_brief, generate_custom_report

router = APIRouter()


@router.get("", response_model=ReportListResponse)
async def list_reports(db: AsyncSession = Depends(get_db)):
    """List all generated reports."""
    result = await db.execute(
        select(Report).order_by(desc(Report.generated_at)).limit(50)
    )
    reports = result.scalars().all()
    return ReportListResponse(
        items=[ReportResponse.model_validate(r) for r in reports],
        total=len(reports),
    )


@router.post("/generate", response_model=ReportResponse)
async def generate_report(request: ReportCreate, db: AsyncSession = Depends(get_db)):
    """Generate a custom threat report."""
    content = await generate_custom_report(
        session=db,
        title=request.title,
        date_from=request.date_from,
        date_to=request.date_to,
        ioc_ids=request.ioc_ids,
        min_score=request.min_score,
        feed_sources=request.feed_sources,
    )

    result = await db.execute(
        select(Report).order_by(desc(Report.generated_at)).limit(1)
    )
    report = result.scalar_one_or_none()
    if report:
        return ReportResponse.model_validate(report)
    raise HTTPException(status_code=500, detail="Report generation failed")


@router.get("/daily-brief")
async def get_daily_brief(db: AsyncSession = Depends(get_db)):
    """Get or generate the daily threat brief."""
    content = await generate_daily_brief(db)
    return content


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific report."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportResponse.model_validate(report)
