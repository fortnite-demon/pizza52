from decimal import Decimal

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import Category, Dish, Ingredient, Modifier, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def seed_categories(db: Session) -> dict[str, Category]:
    categories_data = [
        ("Пиццы", "Классические и авторские пиццы Pizza52"),
        ("Закуски", "Горячие закуски к заказу"),
        ("Напитки", "Освежающие напитки"),
        ("Десерты", "Сладкие десерты"),
    ]
    result: dict[str, Category] = {}
    for name, description in categories_data:
        category = db.query(Category).filter(Category.name == name).first()
        if not category:
            category = Category(name=name, description=description, is_active=True)
            db.add(category)
            db.flush()
        result[name] = category
    return result


def seed_dishes(db: Session, categories: dict[str, Category]) -> None:
    dishes_data = [
        ("Пиццы", "Маргарита", "Томатный соус, моцарелла, базилик", 590, True, "/static/images/margherita.jpg"),
        ("Пиццы", "Пепперони", "Томатный соус, моцарелла, пепперони", 690, True, "/static/images/pepperoni.jpg"),
        ("Пиццы", "Четыре сыра", "Моцарелла, пармезан, чеддер, дорблю", 790, True, "/static/images/quattro_formaggi.jpg"),
        ("Пиццы", "Барбекю", "Соус барбекю, курица, красный лук, сыр", 820, True, "/static/images/bbq.jpg"),
        ("Пиццы", "Гавайская", "Ветчина, ананас, моцарелла, томатный соус", 760, True, "/static/images/hawaiian.jpg"),
        ("Закуски", "Картофель фри", "Хрустящий картофель с солью", 220, False, "/static/images/fries.jpg"),
        ("Закуски", "Куриные крылья (6 шт)", "Острые куриные крылья", 390, False, "/static/images/wings.jpg"),
        ("Закуски", "Хлебные палочки с сыром", "Палочки с чесночным маслом и сыром", 280, False, "/static/images/breadsticks.jpg"),
        ("Напитки", "Coca-Cola 0.5л", "Классическая Coca-Cola", 150, False, "/static/images/cola.jpg"),
        ("Напитки", "Сок апельсиновый", "Апельсиновый сок 0.5л", 170, False, "/static/images/orange_juice.jpg"),
        ("Напитки", "Вода негазированная", "Питьевая вода 0.5л", 90, False, "/static/images/water.jpg"),
        ("Десерты", "Тирамису", "Нежный десерт с кремом маскарпоне", 320, False, "/static/images/tiramisu.jpg"),
        ("Десерты", "Чизкейк Нью-Йорк", "Классический чизкейк", 340, False, "/static/images/cheesecake.jpg"),
    ]

    for category_name, name, description, price, is_constructable, image_url in dishes_data:
        existing = db.query(Dish).filter(Dish.name == name).first()
        if existing:
            if not existing.image_url:
                existing.image_url = image_url
            continue
        dish = Dish(
            category_id=categories[category_name].id,
            name=name,
            description=description,
            base_price=Decimal(price),
            is_available=True,
            is_constructable=is_constructable,
            image_url=image_url,
        )
        db.add(dish)


def seed_ingredients(db: Session) -> None:
    ingredients_data = [
        ("томатный", 35, "g"),
        ("сливочный", 45, "g"),
        ("барбекю", 50, "g"),
        ("острый", 40, "g"),
        ("моцарелла", 80, "g"),
        ("пармезан", 95, "g"),
        ("чеддер", 85, "g"),
        ("пепперони", 110, "g"),
        ("ветчина", 100, "g"),
        ("курица", 95, "g"),
        ("бекон", 120, "g"),
        ("томаты", 45, "g"),
        ("перец", 40, "g"),
        ("грибы", 50, "g"),
        ("лук", 25, "g"),
        ("маслины", 55, "g"),
        ("ананас", 60, "g"),
    ]

    for name, price, unit in ingredients_data:
        exists = db.query(Ingredient).filter(Ingredient.name == name).first()
        if exists:
            continue
        db.add(
            Ingredient(
                name=name,
                price=Decimal(price),
                unit=unit,
                stock_quantity=Decimal("10000"),
                is_available=True,
            )
        )


def seed_modifiers(db: Session) -> None:
    modifiers_data = [
        ("25 см", 0, "size"),
        ("30 см", 150, "size"),
        ("35 см", 300, "size"),
        ("тонкое", 0, "dough"),
        ("традиционное", 0, "dough"),
        ("толстый край", 50, "dough"),
    ]

    for name, price, mtype in modifiers_data:
        exists = db.query(Modifier).filter(Modifier.name == name, Modifier.type == mtype).first()
        if exists:
            continue
        db.add(Modifier(name=name, price=Decimal(price), type=mtype))


def seed_users(db: Session) -> None:
    users = [
        ("admin@pizza52.ru", "Администратор", "admin", None),
    ]
    for email, name, role, phone in users:
        exists = db.query(User).filter(User.email == email).first()
        if exists:
            continue
        db.add(
            User(
                email=email,
                hashed_password=get_password_hash("password"),
                name=name,
                phone=phone,
                role=role,
            )
        )


def main() -> None:
    db = SessionLocal()
    try:
        categories = seed_categories(db)
        seed_dishes(db, categories)
        seed_ingredients(db)
        seed_modifiers(db)
        seed_users(db)
        db.commit()
        print("Seed completed successfully.")
    except Exception as exc:
        db.rollback()
        print(f"Seed failed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
