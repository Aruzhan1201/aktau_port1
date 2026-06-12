import asyncio
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

_bot: Any = None
_bot_available: bool = False

try:
    from telegram import Bot as TelegramBot
    from telegram.error import TelegramError as _TelegramError
    from telegram.request import HTTPXRequest

    _request = HTTPXRequest(connect_timeout=10, read_timeout=10)
    _bot = TelegramBot(token=settings.TELEGRAM_BOT_TOKEN, request=_request) if settings.TELEGRAM_BOT_TOKEN else None
    _bot_available = True
except ImportError:
    _TelegramError = Exception

_polling_task: asyncio.Task | None = None


async def send_telegram_notification(chat_id: str, message: str) -> bool:
    if not _bot or not _bot_available:
        logger.warning("Telegram bot not configured, skipping notification")
        return False
    try:
        await _bot.send_message(chat_id=chat_id, text=message, parse_mode="Markdown")
        return True
    except _TelegramError as e:
        logger.error("Failed to send Telegram message to %s: %s", chat_id, e)
        return False


async def _poll_updates():
    if not _bot or not _bot_available:
        return
    offset = 0
    while True:
        try:
            updates = await _bot.get_updates(offset=offset, timeout=30, allowed_updates=["message", "callback_query"])
            for update in updates:
                offset = update.update_id + 1
                if update.message or update.callback_query:
                    logger.debug("Polled update %s from chat %s", update.update_id,
                                 update.message.chat.id if update.message else
                                 update.callback_query.message.chat.id)
        except _TelegramError as e:
            logger.warning("Telegram polling error: %s", e)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.warning("Telegram polling unexpected error: %s", e)
        await asyncio.sleep(1)


def start_polling():
    global _polling_task
    if _polling_task is not None:
        logger.info("Telegram polling already running")
        return
    if not _bot or not _bot_available:
        logger.warning("Telegram bot not configured, cannot start polling")
        return
    _polling_task = asyncio.create_task(_poll_updates())
    logger.info("Telegram polling started in background")


def stop_polling():
    global _polling_task
    if _polling_task is None:
        return
    _polling_task.cancel()
    _polling_task = None
    logger.info("Telegram polling stopped")


async def set_webhook() -> bool:
    if not _bot or not _bot_available:
        logger.warning("Telegram bot not configured")
        return False
    if settings.TELEGRAM_WEBHOOK_URL:
        try:
            webhook_url = f"{settings.TELEGRAM_WEBHOOK_URL}/telegram/webhook"
            await _bot.set_webhook(url=webhook_url)
            logger.info("Telegram webhook set to %s", webhook_url)
            return True
        except _TelegramError as e:
            logger.error("Failed to set Telegram webhook: %s", e)
    else:
        logger.info("TELEGRAM_WEBHOOK_URL not set, deleting existing webhook and starting polling")
        try:
            await _bot.delete_webhook()
        except _TelegramError:
            pass
        start_polling()
    return False
