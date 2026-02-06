"""Dashboard aggregate API endpoints."""

from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc, case, Integer, cast
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ioc import IOC
from app.models.feed import FeedSource

router = APIRouter()


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate dashboard statistics."""
    now = datetime.now(timezone.utc)
    yesterday = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    total = (await db.execute(select(func.count(IOC.id)))).scalar() or 0
    total_yesterday = (await db.execute(
        select(func.count(IOC.id)).where(IOC.created_at < yesterday)
    )).scalar() or 0

    new_24h = (await db.execute(
        select(func.count(IOC.id)).where(IOC.created_at >= yesterday)
    )).scalar() or 0

    critical = (await db.execute(
        select(func.count(IOC.id)).where(IOC.threat_score >= 76)
    )).scalar() or 0

    avg_score = (await db.execute(
        select(func.avg(IOC.threat_score))
    )).scalar() or 0

    active_feeds = (await db.execute(
        select(func.count(FeedSource.id)).where(FeedSource.is_enabled == True)
    )).scalar() or 0

    total_feeds = (await db.execute(
        select(func.count(FeedSource.id))
    )).scalar() or 0

    # 7-day trend data
    trends = []
    for i in range(7):
        day = now - timedelta(days=6 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_count = (await db.execute(
            select(func.count(IOC.id)).where(
                IOC.created_at >= day_start,
                IOC.created_at < day_end,
            )
        )).scalar() or 0
        trends.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": day_count,
        })

    delta = new_24h
    delta_pct = round((delta / max(total_yesterday, 1)) * 100, 1)

    return {
        "total_iocs": total,
        "new_24h": new_24h,
        "delta_pct": delta_pct,
        "critical_threats": critical,
        "avg_threat_score": round(float(avg_score), 1),
        "active_feeds": active_feeds,
        "total_feeds": total_feeds,
        "trends": trends,
    }


@router.get("/timeline")
async def get_timeline(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get recent IOC ingestion timeline."""
    result = await db.execute(
        select(IOC)
        .order_by(desc(IOC.created_at))
        .limit(limit)
    )
    iocs = result.scalars().all()

    return [
        {
            "id": str(ioc.id),
            "type": ioc.type,
            "value": ioc.value,
            "threat_score": ioc.threat_score,
            "tags": ioc.tags or [],
            "created_at": ioc.created_at.isoformat() if ioc.created_at else None,
            "first_seen": ioc.first_seen.isoformat() if ioc.first_seen else None,
        }
        for ioc in iocs
    ]


@router.get("/geo")
async def get_geo_distribution(db: AsyncSession = Depends(get_db)):
    """Get geographic distribution of threat indicators."""
    # Return aggregated country data from enrichment or metadata
    result = await db.execute(
        select(IOC)
        .where(IOC.type == "ip")
        .order_by(desc(IOC.threat_score))
        .limit(500)
    )
    iocs = result.scalars().all()

    country_counts = {}
    for ioc in iocs:
        meta = ioc.metadata_ or {}
        country = meta.get("country_code") or meta.get("country", "Unknown")
        if country not in country_counts:
            country_counts[country] = {"count": 0, "avg_score": 0, "scores": []}
        country_counts[country]["count"] += 1
        country_counts[country]["scores"].append(ioc.threat_score)

    geo_data = []
    for country, data in country_counts.items():
        scores = data["scores"]
        geo_data.append({
            "country": country,
            "count": data["count"],
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
        })

    return sorted(geo_data, key=lambda x: x["count"], reverse=True)


@router.get("/top-threats")
async def get_top_threats(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get highest-scored IOCs."""
    result = await db.execute(
        select(IOC)
        .where(IOC.threat_score >= 50)
        .order_by(desc(IOC.threat_score))
        .limit(limit)
    )
    iocs = result.scalars().all()

    return [
        {
            "id": str(ioc.id),
            "type": ioc.type,
            "value": ioc.value,
            "threat_score": ioc.threat_score,
            "tags": ioc.tags or [],
            "first_seen": ioc.first_seen.isoformat() if ioc.first_seen else None,
            "last_seen": ioc.last_seen.isoformat() if ioc.last_seen else None,
            "sighting_count": ioc.sighting_count,
        }
        for ioc in iocs
    ]


@router.get("/feed-health")
async def get_feed_health(db: AsyncSession = Depends(get_db)):
    """Get feed status overview."""
    result = await db.execute(select(FeedSource).order_by(FeedSource.name))
    feeds = result.scalars().all()

    now = datetime.now(timezone.utc)
    return [
        {
            "id": str(f.id),
            "name": f.name,
            "slug": f.slug,
            "is_enabled": f.is_enabled,
            "last_sync_at": f.last_sync_at.isoformat() if f.last_sync_at else None,
            "last_sync_status": f.last_sync_status or "never_synced",
            "ioc_count": f.ioc_count,
            "health": _get_feed_health(f, now),
        }
        for f in feeds
    ]


@router.get("/trends")
async def get_trends(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Get IOC trend data over time."""
    now = datetime.now(timezone.utc)
    trends = []

    for i in range(days):
        day = now - timedelta(days=days - 1 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        total = (await db.execute(
            select(func.count(IOC.id)).where(
                IOC.created_at >= day_start,
                IOC.created_at < day_end,
            )
        )).scalar() or 0

        critical = (await db.execute(
            select(func.count(IOC.id)).where(
                IOC.created_at >= day_start,
                IOC.created_at < day_end,
                IOC.threat_score >= 76,
            )
        )).scalar() or 0

        trends.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "total": total,
            "critical": critical,
        })

    return trends


def _get_feed_health(feed: FeedSource, now: datetime) -> str:
    """Determine feed health status."""
    if not feed.is_enabled:
        return "disabled"
    if not feed.last_sync_at:
        return "never_synced"
    if feed.last_sync_status == "failed":
        return "offline"

    age = now - feed.last_sync_at
    if age > timedelta(hours=24):
        return "degraded"
    elif age > timedelta(seconds=feed.sync_frequency * 2):
        return "degraded"
    else:
        return "healthy"
