from pydantic import BaseModel


class DashboardResponse(BaseModel):
    total_cargoes: int
    total_income: float
    income_by_type: dict
    occupied_berths: int
    free_berths: int
    berth_utilization_pct: float
    average_waiting_time_hours: float
    ship_utilization_pct: float
    cargoes_by_status: dict


class RevenueReport(BaseModel):
    total_income: float
    cargo_fees: float
    berth_fees: float
    penalties: float
    by_period: list[dict] | None = None


class WaitingTimeReport(BaseModel):
    average_hours: float
    max_hours: float
    min_hours: float
    by_priority: dict | None = None


class ShipUtilizationReport(BaseModel):
    overall_pct: float
    by_ship: list[dict]
