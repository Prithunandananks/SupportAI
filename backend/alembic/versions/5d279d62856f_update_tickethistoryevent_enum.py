"""update_tickethistoryevent_enum

Revision ID: 5d279d62856f
Revises: 11d123ef30f8
Create Date: 2026-07-19 21:41:29.832722

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5d279d62856f'
down_revision: Union[str, None] = '11d123ef30f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE tickethistoryevent ADD VALUE IF NOT EXISTS 'AUTO_ASSIGNED'")
    op.execute("ALTER TYPE tickethistoryevent ADD VALUE IF NOT EXISTS 'INTERNAL_NOTE_ADDED'")


def downgrade() -> None:
    pass
