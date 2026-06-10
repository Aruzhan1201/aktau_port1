import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base

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
)
from app.websocket.routes import router as ws_router

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting %s", settings.APP_NAME)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
