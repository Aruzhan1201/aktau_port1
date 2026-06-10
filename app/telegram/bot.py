import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from telegram import Bot as TelegramBot
    from telegram.error import TelegramError

    _bot = TelegramBot(token=settings.TELEGRAM_BOT_TOKEN) if settings.TELEGRAM_BOT_TOKEN else None
except ImportError:
    _bot = None


async def send_telegram_notification(chat_id: str, message: str) -> bool:
    if not _bot:
        logger.warning("Telegram bot not configured, skipping notification")
        return False
    try:
        await _bot.send_message(chat_id=chat_id, text=message)
        return True
    except TelegramError as e:
        logger.error("Failed to send Telegram message to %s: %s", chat_id, e)
        return False


async def set_webhook() -> bool:
    if not _bot or not settings.TELEGRAM_WEBHOOK_URL:
        logger.warning("Telegram bot or webhook URL not configured")
        return False
    try:
        webhook_url = f"{settings.TELEGRAM_WEBHOOK_URL}/telegram/webhook"
        await _bot.set_webhook(url=webhook_url)
        logger.info("Telegram webhook set to %s", webhook_url)
        return True
    except TelegramError as e:
        logger.error("Failed to set Telegram webhook: %s", e)
        return False
