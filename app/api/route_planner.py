import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import RoleChecker
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/route-planner", tags=["Route Planner"])

try:
    from openai import AsyncOpenAI
    _client = AsyncOpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL,
    )
except Exception as e:
    logger.warning("Failed to initialize OpenAI for route planner: %s", e)
    _client = None

SYSTEM_PROMPT = """You are a route planning assistant for Aktau Port Logistics.
You help drivers and captains plan delivery routes in the Mangistau region and Caspian Sea.

Available transit routes:
1. TITR Aktau→Baku (Trans-Caspian International Transport Route) — Aktau to Baku, ~310km
2. Caspian North-South — Caspian north-south corridor via Aktau
3. Kuryk→Turkmenbashi — Kuryk port to Turkmenbashi ferry route, ~150km
4. Kuryk→Baku — Kuryk to Baku direct route, ~220km

Rules:
- Answer concisely in 2-4 sentences
- Suggest which route to take based on origin and destination
- Mention approximate distances when relevant
- If the user asks about cargo delivery, ask about origin, destination, and cargo type
- Be friendly and practical"""


class RouteQuestion(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)


class RouteAnswer(BaseModel):
    answer: str


async def _fallback_answer(question: str) -> str:
    q = question.lower()
    if "aktau" in q and "baku" in q:
        return "The TITR (Trans-Caspian International Transport Route) connects Aktau to Baku, approximately 310 km across the Caspian Sea. This is the main east-west corridor used for container and general cargo shipping."
    if "kuryk" in q and "turkmenbashi" in q:
        return "The Kuryk→Turkmenbashi ferry route is about 150 km. It's a dedicated Ro-Ro and ferry corridor used for wheeled cargo and rail wagons."
    if "kuryk" in q and "baku" in q:
        return "The Kuryk→Baku direct route spans approximately 220 km. It's a newer route offering an alternative to the main Aktau-Baku corridor."
    if "mangistau" in q or "route" in q:
        return "Mangistau region has two main ports: Aktau (north) and Kuryk (south). Key Caspian routes: Aktau→Baku (~310km), Kuryk→Turkmenbashi (~150km), Kuryk→Baku (~220km), and the North-South Caspian corridor."
    if "hello" in q or "hi" in q:
        return "Hello! I'm your route planning assistant. Tell me where you need to deliver cargo and I'll suggest the best route!"
    return "I can help with route planning in the Mangistau region and Caspian Sea. Try asking about routes between Aktau, Baku, Kuryk, or Turkmenbashi!"


async def _ai_answer(question: str) -> str:
    try:
        response = await _client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            temperature=0.3,
            max_tokens=300,
        )
        return (response.choices[0].message.content or "").strip()
    except Exception as e:
        logger.error("Route planner AI failed: %s", e)
        return await _fallback_answer(question)


@router.post("/ask", response_model=RouteAnswer)
async def ask_route_question(
    body: RouteQuestion,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker(UserRole.driver, UserRole.captain)),
):
    if _client is None:
        answer = await _fallback_answer(body.question)
    else:
        answer = await _ai_answer(body.question)
    return RouteAnswer(answer=answer)
