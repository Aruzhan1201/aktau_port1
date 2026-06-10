"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-10

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("tax_id", sa.String(100), nullable=True),
        sa.Column("address", sa.String(500), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tax_id"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column(
            "role",
            sa.Enum(
                "client", "captain", "parking_manager", "admin", name="user_role"
            ),
            nullable=False,
        ),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("telegram_chat_id", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "ships",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("imo_number", sa.String(50), nullable=True),
        sa.Column("captain_id", sa.Integer(), nullable=True),
        sa.Column("current_location", postgresql.JSON(), nullable=True),
        sa.Column("capacity", sa.Float(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "available", "berthed", "in_transit", "maintenance", name="ship_status"
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("imo_number"),
        sa.ForeignKeyConstraint(["captain_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "berths",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("manager_id", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("free", "occupied", "maintenance", name="berth_status"),
            nullable=False,
        ),
        sa.Column("capacity", sa.Float(), nullable=False),
        sa.Column("location_coords", postgresql.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
        sa.ForeignKeyConstraint(["manager_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "cargoes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column("ship_id", sa.Integer(), nullable=True),
        sa.Column("cargo_type", sa.String(100), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("origin", sa.String(255), nullable=False),
        sa.Column("destination", sa.String(255), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "created",
                "approved",
                "assigned",
                "loading",
                "in_transit",
                "arrived",
                "delivered",
                name="cargo_status",
            ),
            nullable=False,
        ),
        sa.Column("eta", sa.DateTime(timezone=True), nullable=True),
        sa.Column("priority_score", sa.Float(), nullable=False),
        sa.Column("is_flagged", sa.Boolean(), nullable=False),
        sa.Column("flag_reason", sa.Text(), nullable=True),
        sa.Column("ai_generated", sa.Boolean(), nullable=False),
        sa.Column("ai_confidence", sa.Float(), nullable=True),
        sa.Column("ai_raw_input", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["client_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["ship_id"], ["ships.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "cargo_status_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cargo_id", sa.Integer(), nullable=False),
        sa.Column(
            "from_status",
            sa.Enum(
                "created",
                "approved",
                "assigned",
                "loading",
                "in_transit",
                "arrived",
                "delivered",
                name="cargo_status",
            ),
            nullable=True,
        ),
        sa.Column(
            "to_status",
            sa.Enum(
                "created",
                "approved",
                "assigned",
                "loading",
                "in_transit",
                "arrived",
                "delivered",
                name="cargo_status",
            ),
            nullable=False,
        ),
        sa.Column("changed_by", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cargo_id"], ["cargoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["changed_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "cargo_documents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cargo_id", sa.Integer(), nullable=False),
        sa.Column(
            "document_type",
            sa.Enum(
                "invoice", "customs_declaration", "bill_of_lading", name="document_type"
            ),
            nullable=False,
        ),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column(
            "verification_status",
            sa.Enum(
                "pending", "verified", "flagged", name="verification_status"
            ),
            nullable=False,
        ),
        sa.Column("flagged_reason", sa.Text(), nullable=True),
        sa.Column("verified_by", sa.Integer(), nullable=True),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cargo_id"], ["cargoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["verified_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "berth_reservations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("berth_id", sa.Integer(), nullable=False),
        sa.Column("ship_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "completed", "cancelled", name="reservation_status"),
            nullable=False,
        ),
        sa.Column("arrival_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("departure_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["berth_id"], ["berths.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ship_id"], ["ships.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "assignments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ship_id", sa.Integer(), nullable=False),
        sa.Column("berth_id", sa.Integer(), nullable=False),
        sa.Column("cargo_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("arrival_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("departure_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["ship_id"], ["ships.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["berth_id"], ["berths.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cargo_id"], ["cargoes.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "port_queue",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cargo_id", sa.Integer(), nullable=False),
        sa.Column("ship_id", sa.Integer(), nullable=True),
        sa.Column("priority_score", sa.Float(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("waiting", "assigned", "completed", name="queue_status"),
            nullable=False,
        ),
        sa.Column(
            "entered_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cargo_id"], ["cargoes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ship_id"], ["ships.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "type",
            sa.Enum("cargo_fee", "berth_fee", "penalty", name="payment_type"),
            nullable=False,
        ),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False),
        sa.Column("cargo_id", sa.Integer(), nullable=True),
        sa.Column("reservation_id", sa.Integer(), nullable=True),
        sa.Column("paid_by", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "paid", "refunded", name="payment_status"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["cargo_id"], ["cargoes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(
            ["reservation_id"], ["berth_reservations.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["paid_by"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "type",
            sa.Enum(
                "cargo_update",
                "berth_update",
                "payment_update",
                "system",
                name="notification_type",
            ),
            nullable=False,
        ),
        sa.Column("related_entity_type", sa.String(50), nullable=True),
        sa.Column("related_entity_id", sa.Integer(), nullable=True),
        sa.Column("is_read", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_cargoes_status", "cargoes", ["status"])
    op.create_index("ix_cargoes_client_id", "cargoes", ["client_id"])
    op.create_index("ix_port_queue_status", "port_queue", ["status"])
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index("ix_payments_type", "payments", ["type"])
    op.create_index("ix_berth_reservations_status", "berth_reservations", ["status"])
    op.create_index("ix_cargo_status_logs_cargo_id", "cargo_status_logs", ["cargo_id"])


def downgrade() -> None:
    op.drop_index("ix_cargo_status_logs_cargo_id", table_name="cargo_status_logs")
    op.drop_index("ix_berth_reservations_status", table_name="berth_reservations")
    op.drop_index("ix_payments_type", table_name="payments")
    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_index("ix_port_queue_status", table_name="port_queue")
    op.drop_index("ix_cargoes_client_id", table_name="cargoes")
    op.drop_index("ix_cargoes_status", table_name="cargoes")

    op.drop_table("notifications")
    op.drop_table("payments")
    op.drop_table("port_queue")
    op.drop_table("assignments")
    op.drop_table("berth_reservations")
    op.drop_table("cargo_documents")
    op.drop_table("cargo_status_logs")
    op.drop_table("cargoes")
    op.drop_table("berths")
    op.drop_table("ships")
    op.drop_table("users")
    op.drop_table("companies")

    op.execute("DROP TYPE IF EXISTS notification_type")
    op.execute("DROP TYPE IF EXISTS payment_status")
    op.execute("DROP TYPE IF EXISTS payment_type")
    op.execute("DROP TYPE IF EXISTS queue_status")
    op.execute("DROP TYPE IF EXISTS reservation_status")
    op.execute("DROP TYPE IF EXISTS verification_status")
    op.execute("DROP TYPE IF EXISTS document_type")
    op.execute("DROP TYPE IF EXISTS cargo_status")
    op.execute("DROP TYPE IF EXISTS berth_status")
    op.execute("DROP TYPE IF EXISTS ship_status")
    op.execute("DROP TYPE IF EXISTS user_role")
