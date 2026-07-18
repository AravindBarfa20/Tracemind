"""initial migration

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-07-13 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgcrypto extension for gen_random_uuid()
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))

    # 2. Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('role', sa.String(length=50), server_default=sa.text("'engineer'"), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.PrimaryKeyConstraint('id', name='pk_users')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 3. Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name='fk_organizations_owner_id_users', ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id', name='pk_organizations')
    )
    op.create_index('ix_organizations_slug', 'organizations', ['slug'], unique=True)

    # 4. Create projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='fk_projects_organization_id_organizations', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_projects'),
        sa.UniqueConstraint('organization_id', 'slug', name='uq_projects_organization_slug')
    )

    # 5. Create services table
    op.create_table(
        'services',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('service_type', sa.String(length=50), nullable=False),
        sa.Column('environment', sa.String(length=50), nullable=False),
        sa.Column('base_url', sa.String(length=500), nullable=True),
        sa.Column('health_endpoint', sa.String(length=500), nullable=True),
        sa.Column('team', sa.String(length=255), nullable=True),
        sa.Column('tags', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'"), nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'"), nullable=False),
        sa.Column('status', sa.String(length=50), server_default=sa.text("'active'"), nullable=False),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text("TIMEZONE('utc', NOW())"), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], name='fk_services_owner_id_users', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name='fk_services_project_id_projects', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='fk_services_organization_id_organizations', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_services'),
        sa.UniqueConstraint('project_id', 'slug', name='uq_services_project_slug')
    )
    op.create_index('ix_services_status', 'services', ['status'], unique=False)
    op.create_index('ix_services_team', 'services', ['team'], unique=False)


def downgrade() -> None:
    op.drop_table('services')
    op.drop_table('projects')
    op.drop_table('organizations')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
