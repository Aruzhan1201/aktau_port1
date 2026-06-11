import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.weather_record import WeatherRecord, WeatherPort
from app.services.cache_service import cache_get, cache_set
from app.websocket.manager import manager

logger = logging.getLogger(__name__)

AKTAU_LAT, AKTAU_LON = 43.65, 51.17
KURYK_LAT, KURYK_LON = 43.22, 51.65

STORM_WIND = settings.STORM_WIND_THRESHOLD
STORM_WAVE = settings.STORM_WAVE_THRESHOLD
STORM_VISIBILITY = settings.STORM_VISIBILITY_THRESHOLD


async def _fetch_from_owm(lat: float, lon: float) -> dict | None:
    api_key = settings.OPENWEATHERMAP_API_KEY
    if not api_key:
        return None
    url = "https://api.openweathermap.org/data/3.0/onecall"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "exclude": "minutely,hourly,daily,alerts",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.warning("Failed to fetch weather from OWM: %s", e)
        return None


def _check_storm(wind: float, wave: float, vis: float) -> tuple[bool, str | None]:
    alerts = []
    if wind > STORM_WIND:
        alerts.append(f"High wind: {wind:.1f} m/s (threshold: {STORM_WIND} m/s)")
    if wave > STORM_WAVE:
        alerts.append(f"High waves: {wave:.1f} m (threshold: {STORM_WAVE} m)")
    if vis < STORM_VISIBILITY:
        alerts.append(f"Low visibility: {vis:.0f} m (threshold: {STORM_VISIBILITY} m)")
    if alerts:
        return True, "; ".join(alerts)
    return False, None


async def update_weather_for_port(session: AsyncSession, port: WeatherPort) -> WeatherRecord:
    lat, lon = (AKTAU_LAT, AKTAU_LON) if port == WeatherPort.aktau else (KURYK_LAT, KURYK_LON)
    data = await _fetch_from_owm(lat, lon)

    if data and "current" in data:
        current = data["current"]
        wind = current.get("wind_speed", 0)
        wave = 0.0
        vis = current.get("visibility", 10000)
        water_temp = None
        if "visibility" in current:
            vis = current["visibility"]

        # Try to get marine data if available
        if "rain" in current:
            pass
    else:
        wind = 0
        wave = 0
        vis = 10000
        water_temp = None

    storm_alert, storm_msg = _check_storm(wind, wave, vis)

    record = WeatherRecord(
        port=port,
        wind_speed=wind,
        wind_direction=data.get("current", {}).get("wind_deg", 0) if data else None,
        wave_height=wave,
        visibility=vis,
        water_temperature=water_temp,
        storm_alert=storm_alert,
        storm_alert_message=storm_msg,
        fetched_at=datetime.now(timezone.utc),
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)

    cache_key = f"weather:current:{port.value}"
    await cache_set(cache_key, _record_to_dict(record), ttl=settings.WEATHER_CACHE_TTL_SECONDS)

    if storm_alert:
        await manager.broadcast_weather_alert(port.value, {
            "type": "weather_alert",
            "port": port.value,
            "wind_speed": wind,
            "wave_height": wave,
            "visibility": vis,
            "message": storm_msg,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        # Auto-restrict operations
        from app.models.port_config import PortConfig
        result = await session.execute(
            select(PortConfig).where(PortConfig.port_name == port.value)
        )
        cfg = result.scalar_one_or_none()
        if cfg and cfg.operations_status == "active":
            cfg.operations_status = "restricted"
            await session.commit()

    return record


async def get_current_weather(session: AsyncSession, port: str) -> dict | None:
    cache_key = f"weather:current:{port}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    port_enum = WeatherPort.aktau if port == "aktau" else WeatherPort.kuryk
    result = await session.execute(
        select(WeatherRecord)
        .where(WeatherRecord.port == port_enum)
        .order_by(desc(WeatherRecord.fetched_at))
        .limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        record = await update_weather_for_port(session, port_enum)
    d = _record_to_dict(record)
    await cache_set(cache_key, d, ttl=settings.WEATHER_CACHE_TTL_SECONDS)
    return d


async def get_forecast(session: AsyncSession, port: str) -> list[dict]:
    cache_key = f"weather:forecast:{port}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    api_key = settings.OPENWEATHERMAP_API_KEY
    lat, lon = (AKTAU_LAT, AKTAU_LON) if port == "aktau" else (KURYK_LAT, KURYK_LON)
    forecast = []
    if api_key:
        url = "https://api.openweathermap.org/data/3.0/onecall"
        params = {
            "lat": lat, "lon": lon, "appid": api_key,
            "units": "metric", "exclude": "current,minutely,hourly,alerts",
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()
                for day in data.get("daily", [])[:7]:
                    forecast.append({
                        "date": datetime.fromtimestamp(day["dt"], tz=timezone.utc).isoformat(),
                        "temp_min": day["temp"]["min"],
                        "temp_max": day["temp"]["max"],
                        "wind_speed": day.get("wind_speed", 0),
                        "wave_height": 0,
                        "visibility": day.get("visibility", 10000),
                        "humidity": day.get("humidity", 0),
                        "weather": day.get("weather", [{}])[0].get("description", ""),
                        "icon": day.get("weather", [{}])[0].get("icon", ""),
                    })
        except Exception as e:
            logger.warning("Failed to fetch forecast: %s", e)

    await cache_set(cache_key, forecast, ttl=settings.WEATHER_CACHE_TTL_SECONDS * 2)
    return forecast


async def get_alerts(session: AsyncSession) -> list[dict]:
    alerts = []
    for port in ["aktau", "kuryk"]:
        weather = await get_current_weather(session, port)
        if weather and weather.get("storm_alert"):
            alerts.append(weather)
    return alerts


def _record_to_dict(record: WeatherRecord) -> dict:
    return {
        "id": record.id,
        "port": record.port.value,
        "wind_speed": record.wind_speed,
        "wind_direction": record.wind_direction,
        "wave_height": record.wave_height,
        "visibility": record.visibility,
        "water_temperature": record.water_temperature,
        "storm_alert": record.storm_alert,
        "storm_alert_message": record.storm_alert_message,
        "fetched_at": record.fetched_at.isoformat() if record.fetched_at else None,
    }
