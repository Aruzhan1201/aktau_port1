"""add check constraints for positive amounts

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-10

"""

from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_check_constraint("ck_cargo_weight_positive", "cargoes", "weight > 0")
    op.create_check_constraint("ck_ship_capacity_positive", "ships", "capacity > 0")
    op.create_check_constraint("ck_berth_capacity_positive", "berths", "capacity > 0")
    op.create_check_constraint("ck_payment_amount_positive", "payments", "amount > 0")


def downgrade() -> None:
    op.drop_constraint("ck_payment_amount_positive", "payments")
    op.drop_constraint("ck_berth_capacity_positive", "berths")
    op.drop_constraint("ck_ship_capacity_positive", "ships")
    op.drop_constraint("ck_cargo_weight_positive", "cargoes")
