"""add_is_blocked_to_users

Revision ID: c8a2e4b6d0f1
Revises: 6456907c993c
Create Date: 2026-06-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c8a2e4b6d0f1'
down_revision = '6456907c993c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default='false'),
    )


def downgrade() -> None:
    op.drop_column('users', 'is_blocked')
