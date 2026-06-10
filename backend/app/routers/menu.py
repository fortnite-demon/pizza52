from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.models import Category, Dish, DishIngredient, Modifier

router = APIRouter(prefix="/menu", tags=["menu"])


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None
    image_url: str | None


class DishResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: str | None
    image_url: str | None
    base_price: float
    is_constructable: bool


class DishIngredientResponse(BaseModel):
    ingredient_id: int
    name: str
    price: float
    unit: str
    quantity: float
    is_required: bool


class DishModifierResponse(BaseModel):
    id: int
    name: str
    price: float
    type: str


class DishDetailsResponse(DishResponse):
    ingredients: list[DishIngredientResponse]
    modifiers: list[DishModifierResponse]
    category_name: str | None


@router.get("/categories", response_model=list[CategoryResponse])
def get_categories(db: Session = Depends(get_db)) -> list[CategoryResponse]:
    categories = (
        db.query(Category).filter(Category.is_active.is_(True)).order_by(Category.id.asc()).all()
    )
    return [
        CategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            image_url=category.image_url,
        )
        for category in categories
    ]


@router.get("/dishes", response_model=list[DishResponse])
def get_dishes(
    category_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[DishResponse]:
    query = db.query(Dish).filter(Dish.is_available.is_(True))
    if category_id is not None:
        query = query.filter(Dish.category_id == category_id)
    dishes = query.order_by(Dish.id.asc()).all()

    return [
        DishResponse(
            id=dish.id,
            category_id=dish.category_id,
            name=dish.name,
            description=dish.description,
            image_url=dish.image_url,
            base_price=float(dish.base_price),
            is_constructable=dish.is_constructable,
        )
        for dish in dishes
    ]


@router.get("/dishes/{dish_id}", response_model=DishDetailsResponse)
def get_dish(dish_id: int, db: Session = Depends(get_db)) -> DishDetailsResponse:
    dish = (
        db.query(Dish)
        .options(
            joinedload(Dish.category),
            joinedload(Dish.dish_ingredients).joinedload(DishIngredient.ingredient),
        )
        .filter(Dish.id == dish_id, Dish.is_available.is_(True))
        .first()
    )
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    ingredients = [
        DishIngredientResponse(
            ingredient_id=link.ingredient.id,
            name=link.ingredient.name,
            price=float(link.ingredient.price),
            unit=link.ingredient.unit,
            quantity=float(link.quantity),
            is_required=link.is_required,
        )
        for link in dish.dish_ingredients
        if link.ingredient is not None
    ]

    if dish.is_constructable:
        modifiers = db.query(Modifier).filter(Modifier.type.in_(["size", "topping"])).all()
    else:
        modifiers = []

    serialized_modifiers = [
        DishModifierResponse(
            id=modifier.id,
            name=modifier.name,
            price=float(modifier.price),
            type=modifier.type,
        )
        for modifier in modifiers
    ]

    return DishDetailsResponse(
        id=dish.id,
        category_id=dish.category_id,
        name=dish.name,
        description=dish.description,
        image_url=dish.image_url,
        base_price=float(dish.base_price),
        is_constructable=dish.is_constructable,
        ingredients=ingredients,
        modifiers=serialized_modifiers,
        category_name=dish.category.name if dish.category else None,
    )
