import asyncio

from sqlalchemy import text

from app.core.database import engine, Base
from app.core.config import settings
import app.models  # noqa: F401 — ensure all models are loaded


async def reset_and_seed():
    print(f"Dropping all tables in {settings.DATABASE_URL}")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("All tables dropped.")

    print("Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS public"))
        await conn.execute(text("SET search_path TO public"))
    print("All tables created.")

    await engine.dispose()

    from seed_demo import seed
    await seed()
    print("\nDone. Database reset and seeded successfully.")


if __name__ == "__main__":
    asyncio.run(reset_and_seed())
