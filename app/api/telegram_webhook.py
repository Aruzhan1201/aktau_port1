import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.models.cargo import Cargo
from app.models.deal import Deal
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["Telegram"])

_pending_link: dict[int, str] = {}


async def _get_user_by_chat_id(session: AsyncSession, chat_id: int) -> User | None:
    result = await session.execute(
        select(User).where(User.telegram_chat_id == str(chat_id))
    )
    return result.scalar_one_or_none()


def _status_emoji(status: str) -> str:
    emojis = {
        "created": "\U0001f4cb",
        "approved": "\u2705",
        "assigned": "\u26d4",
        "loading": "\U0001f69a",
        "in_transit": "\U0001f6e4\ufe0f",
        "arrived": "\U0001f4cd",
        "delivered": "\U0001f4e6",
        "cancelled": "\u274c",
        "pending": "\u23f3",
        "active": "\u2705",
        "completed": "\u2705",
        "client_approved": "\u2705",
        "driver_approved": "\u2705",
        "captain_approved": "\u2705",
        "both_approved": "\U0001f91d",
    }
    return emojis.get(status, "\u2753")


def _deal_emoji(deal_type: str) -> str:
    emojis = {
        "cargo_transport": "\U0001f69a",
        "parking_rental": "\U0001f697",
        "berth_rental": "\u26f5",
    }
    return emojis.get(deal_type, "\U0001f4cb")


async def _safe_send(chat_id: int, text: str, buttons: list[list[dict]] | None = None):
    try:
        from telegram import InlineKeyboardButton, InlineKeyboardMarkup

        from app.telegram.bot import _bot

        if not _bot:
            logger.warning("Telegram bot not configured, cannot reply to %s", chat_id)
            return

        reply_markup = None
        if buttons:
            keyboard = [
                [
                    InlineKeyboardButton(
                        btn["text"],
                        callback_data=btn.get("callback_data"),
                        url=btn.get("url"),
                    )
                    for btn in row
                ]
                for row in buttons
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

        await _bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode="Markdown",
            reply_markup=reply_markup,
        )
        logger.info("Replied to chat %s: %.60s", chat_id, text.replace("\n", " "))
    except Exception as e:
        logger.warning("Telegram send_message failed for chat %s: %s", chat_id, e)


def _main_menu_buttons():
    return [
        [
            {"text": "\U0001f69a My Cargoes", "callback_data": "mycargoes"},
            {"text": "\U0001f4b0 My Deals", "callback_data": "mydeals"},
        ],
        [
            {"text": "\u2753 Help", "callback_data": "help"},
            {"text": "\U0001f514 Unlink", "callback_data": "unlink"},
        ],
    ]


async def handle_telegram_update(body: dict, session: AsyncSession):
    logger.debug("handle_telegram_update called, body keys: %s", list(body.keys()))

    callback_query = body.get("callback_query")
    if callback_query:
        chat_id = callback_query.get("message", {}).get("chat", {}).get("id")
        cb_data = callback_query.get("data", "")
        await _handle_callback(chat_id, cb_data, session)
        return

    message = body.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = (message.get("text") or "").strip()

    if not chat_id:
        return

    if not text:
        await _safe_send(
            chat_id,
            "\U0001f916 I can only process text messages for now. Use /help to see what I can do!",
        )
        return

    logger.info("Telegram message from chat %s: %s", chat_id, text[:100])

    if text.startswith("/start") or text.startswith("/link"):
        await _handle_start(chat_id, text, session)
    elif text.startswith("/help"):
        await _handle_help(chat_id)
    elif text.startswith("/status"):
        await _handle_status(chat_id, text, session)
    elif text.startswith("/mycargoes"):
        await _handle_mycargoes(chat_id, session)
    elif text.startswith("/mydeals"):
        await _handle_mydeals(chat_id, session)
    elif text.startswith("/unlink"):
        await _handle_unlink(chat_id, session)
    elif text.startswith("/menu"):
        await _handle_menu(chat_id, session)
    else:
        await _handle_fallback(chat_id, text, session)


@router.post("/webhook")
async def telegram_webhook(request: Request, session: AsyncSession = Depends(get_session)):
    if not settings.TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Telegram not configured")

    body = await request.json()
    await handle_telegram_update(body, session)
    return {"ok": True}


async def _handle_callback(chat_id: int, data: str, session: AsyncSession):
    command_map = {
        "mycargoes": _handle_mycargoes,
        "mydeals": _handle_mydeals,
        "help": _handle_help,
        "unlink": _handle_unlink,
    }
    handler = command_map.get(data)
    if handler:
        await handler(chat_id, session)
    else:
        await _safe_send(chat_id, "\U0001f916 Hmm, I don't recognize that action.")


async def _handle_start(chat_id: int, text: str, session: AsyncSession):
    parts = text.split(maxsplit=1)
    if len(parts) == 2:
        email = parts[1].strip()
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.telegram_chat_id = str(chat_id)
            await session.commit()
            await _safe_send(
                chat_id,
                f"\U0001f389 *Welcome, {user.name}!* Your account has been successfully linked.\n\n"
                f"You'll now receive real-time notifications about your cargo, deals, and berth reservations right here.\n\n"
                f"Here's what I can do for you:\n"
                f"\U0001f69a Check your cargo shipments\n"
                f"\U0001f4b0 View your active deals\n"
                f"\u2753 Get help at any time\n\n"
                f"Use the menu below or type a command!",
                buttons=_main_menu_buttons(),
            )
        else:
            await _safe_send(
                chat_id,
                f"\u274c *User not found* with email `{email}`.\n\n"
                f"Please check the email and try again, or use /start without an email to search manually.\n"
                f"Need a demo account? Try: `admin@aktau.port.kz` with password `demo123`.",
            )
            _pending_link[chat_id] = "awaiting_email"
    else:
        await _safe_send(
            chat_id,
            "\U0001f44b *Hey there! Welcome to Aktau Port Logistics Bot!*\n\n"
            "I'm your personal assistant for managing port operations. To get started, I need to link "
            "your Telegram account with your account in the system.\n\n"
            "\U0001f4ec *How to link:*\n"
            "Simply send me the email address you registered with:\n"
            "`/link your@email.com`\n\n"
            "Or type it below and I'll look it up!\n\n"
            "\U0001f4a1 *Demo accounts:*\n"
            "Try: `/link admin@aktau.port.kz` (password: `demo123`)",
        )
        _pending_link[chat_id] = "awaiting_email"


async def _handle_help(chat_id: int, _session: AsyncSession | None = None):
    await _safe_send(
        chat_id,
        "\U0001f4d6 *Aktau Port Bot \u2014 Help*\n\n"
        "Here are the commands you can use:\n\n"
        "\U0001f504 `/link your@email.com` \u2014 Link your account to get started\n"
        "\U0001f69a `/mycargoes` \u2014 View your cargo shipments\n"
        "\U0001f4b0 `/mydeals` \u2014 View your active deals\n"
        "\U0001f4cc `/status <cargo_id>` \u2014 Check any cargo status (no login needed)\n"
        "\U0001f4ac `/menu` \u2014 Show the interactive menu\n"
        "\U0001f514 `/unlink` \u2014 Disconnect your Telegram from your account\n"
        "\u2753 `/help` \u2014 Show this message again\n\n"
        "\U0001f916 *Tip:* After linking, you'll get automatic notifications when your cargo status changes!",
        buttons=_main_menu_buttons(),
    )


async def _handle_status(chat_id: int, text: str, session: AsyncSession):
    parts = text.split()
    if len(parts) < 2:
        await _safe_send(
            chat_id,
            "\u26a0\ufe0f *Usage:* `/status <cargo_id>`\n\n"
            "Example: `/status 3` \u2014 shows information about cargo #3",
        )
        return

    cargo_id = parts[1]
    try:
        cid = int(cargo_id)
    except ValueError:
        await _safe_send(
            chat_id,
            f"\u274c Invalid cargo ID: `{cargo_id}`. Please provide a number.",
        )
        return

    try:
        result = await session.execute(select(Cargo).where(Cargo.id == cid))
        cargo = result.scalar_one_or_none()
        if cargo:
            status_str = (
                cargo.status.value
                if hasattr(cargo.status, "value")
                else str(cargo.status)
            )
            emoji = _status_emoji(status_str)
            eta_str = (
                cargo.eta.strftime("%Y-%m-%d %H:%M UTC")
                if cargo.eta
                else "Not set"
            )
            msg = (
                f"\U0001f4cc *Cargo #{cargo.id}*\n\n"
                f"{emoji} *Status:* `{status_str}`\n"
                f"\U0001f4e6 *Type:* {cargo.cargo_type}\n"
                f"\U00002696 *Weight:* {cargo.weight}t\n"
                f"\U0001f4cd *Origin:* {cargo.origin}\n"
                f"\U0001f3dd\ufe0f *Destination:* {cargo.destination}\n"
                f"\U0001f552 *ETA:* {eta_str}\n"
            )
            if cargo.sender_name:
                msg += f"\U0001f464 *Sender:* {cargo.sender_name}"
                if cargo.sender_phone:
                    msg += f" ({cargo.sender_phone})"
                msg += "\n"
            if cargo.receiver_name:
                msg += f"\U0001f465 *Receiver:* {cargo.receiver_name}"
                if cargo.receiver_phone:
                    msg += f" ({cargo.receiver_phone})"
                msg += "\n"
            if cargo.priority_score:
                msg += f"\u2b06\ufe0f *Priority:* {cargo.priority_score:.1f}\n"
            if cargo.is_flagged:
                msg += (
                    f"\U0001f6a9 *Flagged:* {cargo.flag_reason or 'Yes'}\n"
                )
            await _safe_send(chat_id, msg)
        else:
            await _safe_send(
                chat_id,
                f"\U0001f50d Cargo #{cid} not found.\n\n"
                "Double-check the ID and try again. Use `/mycargoes` to see your own cargo list.",
            )
    except Exception as e:
        logger.error("Status lookup error: %s", e)
        await _safe_send(
            chat_id,
            f"\U0001f4a5 Sorry, something went wrong looking up cargo #{cargo_id}. Please try again later.",
        )


async def _handle_mycargoes(chat_id: int, session: AsyncSession):
    user = await _get_user_by_chat_id(session, chat_id)
    if not user:
        await _safe_send(
            chat_id,
            "\u26a0\ufe0f *You need to link your account first!*\n\n"
            "Use `/link your@email.com` to connect your Telegram with your account.\n\n"
            "Don't have an account yet? Register on the Aktau Port website first!",
        )
        return

    result = await session.execute(
        select(Cargo)
        .where(
            (Cargo.client_id == user.id)
            | (Cargo.sender_id == user.id)
            | (Cargo.receiver_id == user.id)
            | (Cargo.driver_id == user.id)
        )
        .order_by(Cargo.created_at.desc())
    )
    cargoes = list(result.scalars().all())

    if not cargoes:
        await _safe_send(
            chat_id,
            f"\U0001f50d *No cargo found*, {user.name}.\n\n"
            "You don't have any cargo shipments yet. Create one on the Aktau Port website!",
            buttons=_main_menu_buttons(),
        )
        return

    lines = [f"\U0001f69a *Your Cargo Shipments ({len(cargoes)})*"]
    for c in cargoes[:10]:
        status_str = (
            c.status.value if hasattr(c.status, "value") else str(c.status)
        )
        emoji = _status_emoji(status_str)
        lines.append(f"\n{emoji} *#{c.id}* \u2014 {c.cargo_type}")
        lines.append(f"   {c.origin} \u2192 {c.destination}")
        lines.append(f"   Status: `{status_str}`  |  {c.weight}t")
        if c.eta:
            lines.append(f"   ETA: {c.eta.strftime('%Y-%m-%d')}")

    if len(cargoes) > 10:
        lines.append(
            f"\n\U0001f4ac ...and {len(cargoes) - 10} more. Use the website for full details."
        )

    await _safe_send(chat_id, "\n".join(lines), buttons=_main_menu_buttons())


async def _handle_mydeals(chat_id: int, session: AsyncSession):
    user = await _get_user_by_chat_id(session, chat_id)
    if not user:
        await _safe_send(
            chat_id,
            "\u26a0\ufe0f *You need to link your account first!*\n\n"
            "Use `/link your@email.com` to connect your Telegram with your account.",
        )
        return

    result = await session.execute(
        select(Deal)
        .where(
            (Deal.client_id == user.id)
            | (Deal.driver_id == user.id)
            | (Deal.captain_id == user.id)
        )
        .order_by(Deal.created_at.desc())
    )
    deals = list(result.scalars().all())

    if not deals:
        await _safe_send(
            chat_id,
            f"\U0001f50d *No deals found*, {user.name}.\n\n"
            "You don't have any deals yet. Check the Deals section on the website!",
            buttons=_main_menu_buttons(),
        )
        return

    lines = [f"\U0001f4b0 *Your Deals ({len(deals)})*"]
    for d in deals[:10]:
        deal_type_str = (
            d.deal_type.value if hasattr(d.deal_type, "value") else str(d.deal_type)
        )
        status_str = (
            d.status.value if hasattr(d.status, "value") else str(d.status)
        )
        emoji = _deal_emoji(deal_type_str)
        status_emoji = _status_emoji(status_str)
        lines.append(
            f"\n{emoji} *#{d.id}* \u2014 {deal_type_str.replace('_', ' ').title()}"
        )
        lines.append(f"   {status_emoji} Status: `{status_str}`")
        if d.amount:
            lines.append(f"   \U0001f4b5 Amount: ${d.amount:.2f}")

    if len(deals) > 10:
        lines.append(f"\n\U0001f4ac ...and {len(deals) - 10} more.")

    await _safe_send(chat_id, "\n".join(lines), buttons=_main_menu_buttons())


async def _handle_unlink(chat_id: int, session: AsyncSession):
    user = await _get_user_by_chat_id(session, chat_id)
    if not user:
        await _safe_send(
            chat_id,
            "\U0001f514 Your account wasn't linked to begin with. Nothing to do! \U0001f60a\n\n"
            "Want to link it? Use `/link your@email.com`",
        )
        return

    user.telegram_chat_id = None
    await session.commit()
    await _safe_send(
        chat_id,
        f"\U0001f514 *Account unlinked successfully!*\n\n"
        f"Goodbye, {user.name}! You won't receive notifications here anymore.\n\n"
        f"If you change your mind, just use `/link your@email.com` to reconnect.",
    )


async def _handle_menu(chat_id: int, session: AsyncSession):
    user = await _get_user_by_chat_id(session, chat_id)
    if user:
        await _safe_send(
            chat_id,
            f"\U0001f44b Welcome back, {user.name}! Choose an option below:",
            buttons=_main_menu_buttons(),
        )
    else:
        await _safe_send(
            chat_id,
            "\U0001f916 You haven't linked your account yet. Use `/link your@email.com` to get started!",
        )


async def _handle_fallback(chat_id: int, text: str, session: AsyncSession):
    if _pending_link.get(chat_id) == "awaiting_email":
        email = text.strip().lower()
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.telegram_chat_id = str(chat_id)
            await session.commit()
            _pending_link.pop(chat_id, None)
            await _safe_send(
                chat_id,
                f"\U0001f389 *Welcome, {user.name}!* Your account has been successfully linked.\n\n"
                f"You'll now receive real-time notifications about your cargo, deals, and berth reservations "
                f"right here.\n\n"
                f"Here's what I can do for you:\n"
                f"\U0001f69a Check your cargo shipments\n"
                f"\U0001f4b0 View your active deals\n"
                f"\u2753 Get help at any time\n\n"
                f"Use the menu below or type a command!",
                buttons=_main_menu_buttons(),
            )
        else:
            await _safe_send(
                chat_id,
                f"\u274c No account found with email `{email}`.\n\n"
                f"Please check the email and try again, or type /help for available commands.\n"
                f"Demo accounts use emails like `admin@aktau.port.kz` with password `demo123`.",
            )
        return

    user = await _get_user_by_chat_id(session, chat_id)
    if user:
        await _safe_send(
            chat_id,
            f"\U0001f916 Sorry, I didn't understand that, {user.name}.\n\n"
            f"I can help you with these commands:\n"
            f"\U0001f69a `/mycargoes` \u2014 View your cargo shipments\n"
            f"\U0001f4b0 `/mydeals` \u2014 View your deals\n"
            f"\U0001f4cc `/status <id>` \u2014 Check cargo status\n"
            f"\U0001f4ac `/menu` \u2014 Show the interactive menu\n\n"
            f"Or just use the buttons below!",
            buttons=_main_menu_buttons(),
        )
    else:
        await _safe_send(
            chat_id,
            "\U0001f916 *Hello! I'm the Aktau Port Logistics Bot.*\n\n"
            "I don't recognize that message. Here's how to get started:\n\n"
            "\U0001f504 `/link your@email.com` \u2014 Link your account\n"
            "\u2753 `/help` \u2014 See all available commands\n\n"
            "If you're new, register on the Aktau Port website first, then come back and link your account!",
            buttons=_main_menu_buttons(),
        )
