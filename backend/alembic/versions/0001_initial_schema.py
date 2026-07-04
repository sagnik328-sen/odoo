"""Establish the initial HRMS database baseline.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-04
"""

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """No domain tables are introduced in Milestone 1."""


def downgrade() -> None:
    """No domain tables are removed in Milestone 1."""

