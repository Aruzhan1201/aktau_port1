"""add new roles (sender, receiver, gov_authority, super_admin), new models, cargo extensions

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # User role enum migration - add new values
    op.execute("ALTER TYPE user_role ADD VALUE 'sender' AFTER 'client'")
    op.execute("ALTER TYPE user_role ADD VALUE 'receiver'")
    op.execute("ALTER TYPE user_role ADD VALUE 'gov_authority'")
    op.execute("ALTER TYPE user_role ADD VALUE 'super_admin'")

    # Berth status enum - add 'reserved'
    op.execute("ALTER TYPE berth_status ADD VALUE 'reserved' AFTER 'free'")

    # Cargo table - add new columns
    op.add_column("cargoes", sa.Column("sender_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("cargoes", sa.Column("receiver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("cargoes", sa.Column("sender_company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=True))
    op.add_column("cargoes", sa.Column("receiver_company_id", sa.Integer(), sa.ForeignKey("companies.id"), nullable=True))
    op.add_column("cargoes", sa.Column("driver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("cargoes", sa.Column("sender_name", sa.String(255), nullable=True))
    op.add_column("cargoes", sa.Column("sender_phone", sa.String(50), nullable=True))
    op.add_column("cargoes", sa.Column("receiver_name", sa.String(255), nullable=True))
    op.add_column("cargoes", sa.Column("receiver_phone", sa.String(50), nullable=True))
    op.add_column("cargoes", sa.Column("captain_approved", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("cargoes", sa.Column("client_approved", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("cargoes", sa.Column("phone_revealed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("cargoes", sa.Column("is_ro_ro", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("cargoes", sa.Column("vehicle_count", sa.Integer(), nullable=True))

    # Create new tables
    op.create_table(
        "weather_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("port", sa.Enum("aktau", "kuryk", name="weather_port"), nullable=False),
        sa.Column("wind_speed", sa.Float(), nullable=False, server_default="0"),
        sa.Column("wind_direction", sa.String(50), nullable=True),
        sa.Column("wave_height", sa.Float(), nullable=False, server_default="0"),
        sa.Column("visibility", sa.Float(), nullable=False, server_default="10000"),
        sa.Column("water_temperature", sa.Float(), nullable=True),
        sa.Column("storm_alert", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("storm_alert_message", sa.String(500), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "incident_reports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("port", sa.String(50), nullable=False),
        sa.Column("incident_type", sa.String(100), nullable=False),
        sa.Column("severity", sa.Enum("low", "medium", "high", "critical", name="incident_severity"), nullable=False, server_default="medium"),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("reported_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("status", sa.Enum("open", "investigating", "resolved", name="incident_status"), nullable=False, server_default="open"),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ro_ro_vehicles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("plate_number", sa.String(50), nullable=False),
        sa.Column("driver_name", sa.String(255), nullable=False),
        sa.Column("driver_phone", sa.String(50), nullable=True),
        sa.Column("vehicle_type", sa.String(100), nullable=False, server_default="car"),
        sa.Column("cargo_id", sa.Integer(), sa.ForeignKey("cargoes.id"), nullable=True),
        sa.Column("port", sa.String(50), nullable=False, server_default="aktau"),
        sa.Column("status", sa.Enum("entered", "loading", "loaded", "exited", name="ro_ro_status"), nullable=False, server_default="entered"),
        sa.Column("entry_time", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("exit_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ro_ro_processing_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("vehicle_id", sa.Integer(), sa.ForeignKey("ro_ro_vehicles.id"), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("operator_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "tariff_plans",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("port", sa.String(50), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("service_type", sa.String(50), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(50), nullable=False, server_default="per_hour"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "berth_status_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("berth_id", sa.Integer(), sa.ForeignKey("berths.id"), nullable=False),
        sa.Column("old_status", sa.String(50), nullable=True),
        sa.Column("new_status", sa.String(50), nullable=False),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "port_configs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("port_name", sa.String(50), unique=True, nullable=False),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("center_lat", sa.Float(), nullable=False),
        sa.Column("center_lng", sa.Float(), nullable=False),
        sa.Column("zoom_level", sa.Integer(), nullable=False, server_default="14"),
        sa.Column("config_json", JSON(), nullable=True),
        sa.Column("operations_status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "transit_routes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("port", sa.String(50), nullable=False),
        sa.Column("waypoints", JSON(), nullable=False),
        sa.Column("color_hex", sa.String(7), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("distance_km", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "performance_reports",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("port", sa.String(50), nullable=False),
        sa.Column("report_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("generated_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("parameters", JSON(), nullable=True),
        sa.Column("data", JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Insert default port configs
    op.execute(
        "INSERT INTO port_configs (port_name, display_name, center_lat, center_lng, zoom_level, operations_status) "
        "VALUES ('aktau', 'Aktau Port', 43.65, 51.17, 14, 'active')"
    )
    op.execute(
        "INSERT INTO port_configs (port_name, display_name, center_lat, center_lng, zoom_level, operations_status) "
        "VALUES ('kuryk', 'Kuryk Port', 43.22, 51.65, 14, 'active')"
    )

    # Insert default transit routes
    op.execute(
        "INSERT INTO transit_routes (name, port, waypoints, color_hex, description) VALUES ("
        "'TITR', 'aktau', '[{\"lat\":43.65,\"lng\":51.17},{\"lat\":43.50,\"lng\":51.50},{\"lat\":43.30,\"lng\":51.80},{\"lat\":43.10,\"lng\":52.10}]', "
        "'#10b981', 'Trans-Caspian International Transport Route (TITR) corridor')"
    )
    op.execute(
        "INSERT INTO transit_routes (name, port, waypoints, color_hex, description) VALUES ("
        "'Caspian', 'aktau', '[{\"lat\":43.65,\"lng\":51.17},{\"lat\":43.20,\"lng\":51.00},{\"lat\":42.50,\"lng\":50.50},{\"lat\":41.80,\"lng\":50.00}]', "
        "'#3b82f6', 'Caspian Sea transit route - Aktau to southern Caspian ports')"
    )
    op.execute(
        "INSERT INTO transit_routes (name, port, waypoints, color_hex, description) VALUES ("
        "'TITR', 'kuryk', '[{\"lat\":43.22,\"lng\":51.65},{\"lat\":43.10,\"lng\":51.90},{\"lat\":42.90,\"lng\":52.20},{\"lat\":42.70,\"lng\":52.50}]', "
        "'#10b981', 'TITR corridor from Kuryk port')"
    )
    op.execute(
        "INSERT INTO transit_routes (name, port, waypoints, color_hex, description) VALUES ("
        "'Caspian', 'kuryk', '[{\"lat\":43.22,\"lng\":51.65},{\"lat\":42.80,\"lng\":51.30},{\"lat\":42.30,\"lng\":50.80},{\"lat\":41.80,\"lng\":50.00}]', "
        "'#3b82f6', 'Caspian Sea transit route from Kuryk')"
    )


def downgrade() -> None:
    op.drop_table("performance_reports")
    op.drop_table("transit_routes")
    op.drop_table("port_configs")
    op.drop_table("berth_status_logs")
    op.drop_table("tariff_plans")
    op.drop_table("ro_ro_processing_logs")
    op.drop_table("ro_ro_vehicles")
    op.drop_table("incident_reports")
    op.drop_table("weather_records")

    op.drop_column("cargoes", "vehicle_count")
    op.drop_column("cargoes", "is_ro_ro")
    op.drop_column("cargoes", "phone_revealed_at")
    op.drop_column("cargoes", "client_approved")
    op.drop_column("cargoes", "captain_approved")
    op.drop_column("cargoes", "receiver_phone")
    op.drop_column("cargoes", "receiver_name")
    op.drop_column("cargoes", "sender_phone")
    op.drop_column("cargoes", "sender_name")
    op.drop_column("cargoes", "driver_id")
    op.drop_column("cargoes", "receiver_company_id")
    op.drop_column("cargoes", "sender_company_id")
    op.drop_column("cargoes", "receiver_id")
    op.drop_column("cargoes", "sender_id")
