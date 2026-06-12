import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app import models

from app.api import (
    auth,
    company,
    cargo,
    cargo_documents,
    ships,
    berths,
    assignments,
    port_queue,
    payments,
    notifications,
    analytics,
    ai_order,
    maps,
    telegram_webhook,
    weather,
    incidents,
    ro_ro,
    tariffs,
    reports,
    admin_users,
    port_admin,
    gov_analytics,
    parking,
    deals,
    governance,
    route_planner,
)
from app.websocket.routes import router as ws_router

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def _migrate_payments(conn):
    """Add payment detail columns if missing (Postgres)."""
    dialect = conn.dialect.name
    if dialect != "postgresql":
        return
    for col_name, col_type in [
        ("bank_name", "VARCHAR(100)"),
        ("bank_account", "VARCHAR(50)"),
        ("payment_method", "VARCHAR(30)"),
        ("reference_number", "VARCHAR(100)"),
    ]:
        try:
            await conn.execute(
                f"ALTER TABLE payments ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
            )
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.APP_NAME)
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS public"))
            await conn.execute(text("SET search_path TO public"))

            tables_before = await conn.run_sync(
                lambda sync_conn: [t for t in Base.metadata.tables.keys()]
            )
            logger.info("Models in metadata: %s", tables_before)

            await conn.run_sync(Base.metadata.create_all)
            await _migrate_payments(conn)

            from sqlalchemy import inspect as sa_inspect
            tables_after = await conn.run_sync(
                lambda sc: sa_inspect(sc).get_table_names()
            )
            logger.info("Tables in database after create_all: %s", tables_after)

            for tbl in ("berth_reservations", "users", "berths"):
                if tbl not in tables_after:
                    logger.error("CRITICAL: table '%s' was NOT created!", tbl)
    except Exception as e:
        logger.exception("Database table creation failed: %s", e)
        raise
    logger.info("Database tables synced")

    try:
        from app.telegram.bot import set_webhook
        await set_webhook()
    except Exception as e:
        logger.warning("Telegram webhook setup failed: %s", e)

    try:
        from app.services.cache_service import init_redis
        await init_redis()
    except Exception as e:
        logger.warning("Redis init failed: %s", e)

    try:
        from app.services.scheduler_service import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.warning("Scheduler start failed: %s", e)

    yield

    try:
        from app.services.scheduler_service import stop_scheduler
        stop_scheduler()
    except Exception as e:
        logger.warning("Scheduler stop failed: %s", e)

    try:
        from app.services.cache_service import close_redis
        await close_redis()
    except Exception as e:
        logger.warning("Redis close failed: %s", e)

    await engine.dispose()
    logger.info("Engine disposed")


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(company.router)
app.include_router(cargo.router)
app.include_router(cargo_documents.router)
app.include_router(ships.router)
app.include_router(berths.router)
app.include_router(assignments.router)
app.include_router(port_queue.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(ai_order.router)
app.include_router(maps.router)
app.include_router(telegram_webhook.router)
app.include_router(weather.router)
app.include_router(incidents.router)
app.include_router(ro_ro.router)
app.include_router(tariffs.router)
app.include_router(reports.router)
app.include_router(admin_users.router)
app.include_router(port_admin.router)
app.include_router(gov_analytics.router)
app.include_router(parking.router)
app.include_router(deals.router)
app.include_router(governance.router)
app.include_router(route_planner.router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
