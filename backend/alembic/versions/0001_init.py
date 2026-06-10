"""initial schema

Revision ID: 0001_init
Revises:
Create Date: 2026-05-10 00:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_id", "users", ["id"], unique=False)

    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
    )
    op.create_unique_constraint("uq_categories_name", "categories", ["name"])

    op.create_table(
        "ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit", sa.String(length=20), nullable=False),
        sa.Column("stock_quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
    )
    op.create_unique_constraint("uq_ingredients_name", "ingredients", ["name"])

    op.create_table(
        "modifiers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
    )

    op.create_table(
        "addresses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("street", sa.String(length=120), nullable=False),
        sa.Column("house", sa.String(length=20), nullable=False),
        sa.Column("apartment", sa.String(length=20), nullable=True),
        sa.Column("is_default", sa.Boolean(), nullable=False),
    )

    op.create_table(
        "dishes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("base_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False),
        sa.Column("is_constructable", sa.Boolean(), nullable=False),
    )
    op.create_index("ix_dishes_name", "dishes", ["name"], unique=False)

    op.create_table(
        "custom_dishes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("dish_id", sa.Integer(), sa.ForeignKey("dishes.id"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("address_id", sa.Integer(), sa.ForeignKey("addresses.id"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("total_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "dish_ingredients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("dish_id", sa.Integer(), sa.ForeignKey("dishes.id"), nullable=False),
        sa.Column("ingredient_id", sa.Integer(), sa.ForeignKey("ingredients.id"), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
    )

    op.create_table(
        "custom_dish_modifiers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "custom_dish_id", sa.Integer(), sa.ForeignKey("custom_dishes.id"), nullable=False
        ),
        sa.Column("modifier_id", sa.Integer(), sa.ForeignKey("modifiers.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
    )

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("dish_id", sa.Integer(), sa.ForeignKey("dishes.id"), nullable=False),
        sa.Column(
            "custom_dish_id", sa.Integer(), sa.ForeignKey("custom_dishes.id"), nullable=True
        ),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
    )

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("dish_id", sa.Integer(), sa.ForeignKey("dishes.id"), nullable=False),
        sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating"),
    )


def downgrade() -> None:
    op.drop_table("reviews")
    op.drop_table("order_items")
    op.drop_table("custom_dish_modifiers")
    op.drop_table("dish_ingredients")
    op.drop_table("orders")
    op.drop_table("custom_dishes")
    op.drop_index("ix_dishes_name", table_name="dishes")
    op.drop_table("dishes")
    op.drop_table("addresses")
    op.drop_table("modifiers")
    op.drop_constraint("uq_ingredients_name", "ingredients", type_="unique")
    op.drop_table("ingredients")
    op.drop_constraint("uq_categories_name", "categories", type_="unique")
    op.drop_table("categories")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
