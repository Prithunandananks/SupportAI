"""Update TicketStatus Enum

Revision ID: 6436df35731a
Revises: 20be8d66e9b8
Create Date: 2026-07-18 23:30:14.369140

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6436df35731a'
down_revision: Union[str, None] = '20be8d66e9b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update existing records
    op.execute("UPDATE tickets SET status = 'RESOLVED' WHERE status IN ('WAITING_FOR_CUSTOMER', 'CLOSED');")
    
    # 2. Rename old enum
    op.execute("ALTER TYPE ticketstatus RENAME TO ticketstatus_old;")
    
    # 3. Create new enum
    op.execute("CREATE TYPE ticketstatus AS ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED');")
    
    # 4. Alter column to use new enum
    op.execute("ALTER TABLE tickets ALTER COLUMN status TYPE ticketstatus USING status::text::ticketstatus;")
    
    # 5. Drop old enum
    op.execute("DROP TYPE ticketstatus_old;")


def downgrade() -> None:
    op.execute("ALTER TYPE ticketstatus RENAME TO ticketstatus_new;")
    op.execute("CREATE TYPE ticketstatus AS ENUM('OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED');")
    op.execute("ALTER TABLE tickets ALTER COLUMN status TYPE ticketstatus USING status::text::ticketstatus;")
    op.execute("DROP TYPE ticketstatus_new;")
