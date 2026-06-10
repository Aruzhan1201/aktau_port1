from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.models.cargo import Cargo

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/webhook")
async def telegram_webhook(request: Request, session: AsyncSession = Depends(get_session)):
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Telegram not configured")

    body = await request.json()
    message = body.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = message.get("text", "")

    if not chat_id or not text:
        return {"ok": True}

    from app.telegram.bot import _bot

    async def _safe_send(chat_id: int, text: str):
        if _bot:
            try:
                await _bot.send_message(chat_id=chat_id, text=text)
            except Exception as e:
                logger.warning("Telegram send_message failed: %s", e)

    if text.startswith("/start"):
        await _safe_send(
            chat_id,
            "Welcome to Aktau Port Logistics Bot!\n\n"
            "You will receive notifications about your cargo, berth reservations, and payments.\n"
            "Use /help for available commands.",
        )

    elif text.startswith("/help"):
        await _safe_send(
            chat_id,
            "Available commands:\n"
            "/start - Register for notifications\n"
            "/help - Show this message\n"
            "/status <cargo_id> - Check cargo status",
        )

    elif text.startswith("/status"):
        parts = text.split()
        if len(parts) < 2:
            await _safe_send(chat_id, "Usage: /status <cargo_id>")
            return {"ok": True}

        cargo_id = parts[1]
        try:
            result = await session.execute(
                select(Cargo).where(Cargo.id == int(cargo_id))
            )
            cargo = result.scalar_one_or_none()
            if cargo:
                await _safe_send(
                    chat_id,
                    f"Cargo #{cargo.id}\nType: {cargo.cargo_type}\nWeight: {cargo.weight}t\n"
                    f"From: {cargo.origin} -> {cargo.destination}\nStatus: {cargo.status.value}\n"
                    f"ETA: {cargo.eta.isoformat() if cargo.eta else 'N/A'}",
                )
            else:
                await _safe_send(chat_id, "Cargo not found.")
        except Exception as e:
            await _safe_send(chat_id, f"Error: {str(e)}")

    return {"ok": True}
