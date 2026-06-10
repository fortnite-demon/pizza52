from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30))
    role: Mapped[str] = mapped_column(String(20), default="customer", nullable=False)
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    addresses: Mapped[list["Address"]] = relationship(back_populates="user")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="user")
    custom_dishes: Mapped[list["CustomDish"]] = relationship(back_populates="user")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    street: Mapped[str] = mapped_column(String(120), nullable=False)
    house: Mapped[str] = mapped_column(String(20), nullable=False)
    apartment: Mapped[str | None] = mapped_column(String(20))
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="addresses")
    orders: Mapped[list["Order"]] = relationship(back_populates="address")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    dishes: Mapped[list["Dish"]] = relationship(back_populates="category")


class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(String(500))
    base_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    is_constructable: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped["Category"] = relationship(back_populates="dishes")
    cart_items: Mapped[list["CartItem"]] = relationship(back_populates="dish")
    dish_ingredients: Mapped[list["DishIngredient"]] = relationship(back_populates="dish")
    custom_dishes: Mapped[list["CustomDish"]] = relationship(back_populates="dish")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="dish")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="g")
    stock_quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

    dish_ingredients: Mapped[list["DishIngredient"]] = relationship(back_populates="ingredient")


class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), nullable=False)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=1)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)

    dish: Mapped["Dish"] = relationship(back_populates="dish_ingredients")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="dish_ingredients")


class Modifier(Base):
    __tablename__ = "modifiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    type: Mapped[str] = mapped_column(String(20), nullable=False)

    custom_dish_modifiers: Mapped[list["CustomDishModifier"]] = relationship(
        back_populates="modifier"
    )


class CustomDish(Base):
    __tablename__ = "custom_dishes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    size_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    dough_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sauce_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    toppings_names: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="custom_dishes")
    dish: Mapped["Dish"] = relationship(back_populates="custom_dishes")
    modifiers: Mapped[list["CustomDishModifier"]] = relationship(back_populates="custom_dish")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="custom_dish")


class CustomDishModifier(Base):
    __tablename__ = "custom_dish_modifiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    custom_dish_id: Mapped[int] = mapped_column(ForeignKey("custom_dishes.id"), nullable=False)
    modifier_id: Mapped[int] = mapped_column(ForeignKey("modifiers.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    custom_dish: Mapped["CustomDish"] = relationship(back_populates="modifiers")
    modifier: Mapped["Modifier"] = relationship(back_populates="custom_dish_modifiers")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    address_id: Mapped[int | None] = mapped_column(ForeignKey("addresses.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    total_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    payment_method: Mapped[str] = mapped_column(String(20), default="cash", nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="orders")
    address: Mapped["Address | None"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), nullable=False)
    custom_dish_id: Mapped[int | None] = mapped_column(ForeignKey("custom_dishes.id"))
    custom_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    modifiers: Mapped[list | None] = mapped_column(JSON, nullable=True)

    order: Mapped["Order"] = relationship(back_populates="items")
    dish: Mapped["Dish"] = relationship(back_populates="order_items")
    custom_dish: Mapped["CustomDish | None"] = relationship(back_populates="order_items")


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), nullable=False)
    custom_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    modifiers: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="cart_items")
    dish: Mapped["Dish"] = relationship(back_populates="cart_items")


