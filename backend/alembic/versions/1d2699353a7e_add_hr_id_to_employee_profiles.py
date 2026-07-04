"""add hr_id to employee_profiles

Revision ID: 1d2699353a7e
Revises: 6dd83debf473
Create Date: 2026-07-04 15:49:41.262213
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '1d2699353a7e'
down_revision: Union[str, None] = '6dd83debf473'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('employee_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('hr_id', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_employee_profiles_hr', 'users', ['hr_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    with op.batch_alter_table('employee_profiles', schema=None) as batch_op:
        batch_op.drop_constraint('fk_employee_profiles_hr', type_='foreignkey')
        batch_op.drop_column('hr_id')

