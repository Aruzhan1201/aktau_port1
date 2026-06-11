"""add new roles (client, driver, port_manager, governance), parking zones, deals, cargo extensions

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-11

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # User role enum migration - add new values (client already exists from 0001)
    op.execute("ALTER TYPE user_role ADD VALUE 'driver'")
    op.execute("ALTER TYPE user_role ADD VALUE 'port_manager'")
    op.execute("ALTER TYPE user_role ADD VALUE 'governance'")

    # Cargo table - add new columns
    op.add_column("cargoes", sa.Column("route_waypoints", JSON(), nullable=True))
    op.add_column("cargoes", sa.Column("vehicle_type", sa.Enum("ship", "car", "both", name="vehicle_type"), nullable=True))
    op.add_column("cargoes", sa.Column("budget", sa.Float(), nullable=True))

    # Create parking_zones table
    op.create_table(
        "parking_zones",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), unique=True, nullable=False),
        sa.Column("port", sa.String(50), nullable=False, server_default="aktau"),
        sa.Column("manager_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.Enum("active", "inactive", "full", name="parking_zone_status"), nullable=False, server_default="active"),
        sa.Column("capacity", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("location_coords", JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("capacity > 0", name="ck_parking_zone_capacity_positive"),
    )

    # Create parking_spots table
    op.create_table(
        "parking_spots",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("zone_id", sa.Integer(), sa.ForeignKey("parking_zones.id"), nullable=False),
        sa.Column("spot_number", sa.String(20), nullable=False),
        sa.Column("status", sa.Enum("free", "reserved", "occupied", "maintenance", name="parking_spot_status"), nullable=False, server_default="free"),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("tariff_per_hour", sa.Float(precision=2), nullable=True, server_default="5.0"),
        sa.Column("time_in", sa.DateTime(timezone=True), nullable=True),
        sa.Column("time_out", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create deals table
    op.create_table(
        "deals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("type", sa.Enum("cargo_transport", "parking_rental", "berth_rental", name="deal_type"), nullable=False),
        sa.Column("status", sa.Enum("pending", "client_approved", "driver_approved", "captain_approved", "both_approved", "completed", "cancelled", name="deal_status"), nullable=False, server_default="pending"),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("driver_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("captain_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("cargo_id", sa.Integer(), sa.ForeignKey("cargoes.id"), nullable=True),
        sa.Column("proposed_price", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
        sa.Column("client_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("driver_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("captain_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("client_approved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("driver_approved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("captain_approved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("phone_revealed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("deals")
    op.drop_table("parking_spots")
    op.drop_table("parking_zones")

    op.drop_column("cargoes", "budget")
    op.drop_column("cargoes", "vehicle_type")
    op.drop_column("cargoes", "route_waypoints")
