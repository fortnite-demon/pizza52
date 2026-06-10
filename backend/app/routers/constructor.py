from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import CustomDish, CustomDishModifier, Dish, Ingredient, Modifier, OrderItem, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/constructor", tags=["constructor"])

SAUCE_NAMES = {"томатный", "сливочный", "барбекю", "острый"}
CHEESE_KEYWORDS = {"моцарелла", "пармезан", "чеддер", "гауда"}
MEAT_KEYWORDS = {"пепперони", "ветчина", "курица", "бекон"}


# ---------- Schemas ----------

class ModifierOption(BaseModel):
    id: int
    name: str
    price: float
    type: str


class IngredientOption(BaseModel):
    id: int
    name: str
    price: float
    unit: str


class ToppingGroups(BaseModel):
    Сыры: list[IngredientOption]
    Мясо: list[IngredientOption]
    Овощи: list[IngredientOption]


class ConstructorOptionsResponse(BaseModel):
    base_dish_id: int
    sizes: list[ModifierOption]
    doughs: list[ModifierOption]
    sauces: list[IngredientOption]
    toppings: ToppingGroups


class SaveCustomPizzaRequest(BaseModel):
    name: str
    size_id: int | None = None
    dough_id: int | None = None
    sauce_id: int | None = None
    topping_ids: list[int] = []
    total_price: float


class CustomPizzaResponse(BaseModel):
    id: int
    name: str
    total_price: float
    created_at: str
    base_dish_id: int
    size: str | None
    dough: str | None
    sauce: str | None
    toppings: list[str]


# ---------- Helpers ----------

def _to_mod(m: Modifier) -> ModifierOption:
    return ModifierOption(id=m.id, name=m.name, price=float(m.price), type=m.type)


def _to_ing(i: Ingredient) -> IngredientOption:
    return IngredientOption(id=i.id, name=i.name, price=float(i.price), unit=i.unit)


def _serialize_pizza(p: CustomDish) -> CustomPizzaResponse:
    return CustomPizzaResponse(
        id=p.id,
        name=p.name,
        total_price=float(p.total_price),
        created_at=p.created_at.isoformat(),
        base_dish_id=p.dish_id,
        size=p.size_name,
        dough=p.dough_name,
        sauce=p.sauce_name,
        toppings=p.toppings_names or [],
    )


# ---------- Endpoints ----------

@router.get("/options", response_model=ConstructorOptionsResponse)
def get_constructor_options(db: Session = Depends(get_db)) -> ConstructorOptionsResponse:
    base_dish = (
        db.query(Dish)
        .filter(Dish.is_constructable.is_(True), Dish.is_available.is_(True))
        .first()
    )
    if not base_dish:
        raise HTTPException(status_code=404, detail="No base pizza found")

    sizes = db.query(Modifier).filter(Modifier.type == "size").order_by(Modifier.price.asc()).all()
    doughs = db.query(Modifier).filter(Modifier.type == "dough").order_by(Modifier.id.asc()).all()

    all_ingredients = db.query(Ingredient).filter(Ingredient.is_available.is_(True)).all()

    sauces = [i for i in all_ingredients if i.name in SAUCE_NAMES]
    non_sauce = [i for i in all_ingredients if i.name not in SAUCE_NAMES]

    cheeses, meats, veggies = [], [], []
    for ing in non_sauce:
        lower = ing.name.lower()
        if any(k in lower for k in CHEESE_KEYWORDS):
            cheeses.append(ing)
        elif any(k in lower for k in MEAT_KEYWORDS):
            meats.append(ing)
        else:
            veggies.append(ing)

    return ConstructorOptionsResponse(
        base_dish_id=base_dish.id,
        sizes=[_to_mod(m) for m in sizes],
        doughs=[_to_mod(m) for m in doughs],
        sauces=[_to_ing(i) for i in sauces],
        toppings=ToppingGroups(
            Сыры=[_to_ing(i) for i in cheeses],
            Мясо=[_to_ing(i) for i in meats],
            Овощи=[_to_ing(i) for i in veggies],
        ),
    )


@router.post("/save", status_code=201)
def save_custom_pizza(
    payload: SaveCustomPizzaRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    base_dish = (
        db.query(Dish)
        .filter(Dish.is_constructable.is_(True), Dish.is_available.is_(True))
        .first()
    )
    if not base_dish:
        raise HTTPException(status_code=404, detail="No base pizza found")

    size = db.query(Modifier).filter(Modifier.id == payload.size_id).first() if payload.size_id else None
    dough = db.query(Modifier).filter(Modifier.id == payload.dough_id).first() if payload.dough_id else None
    sauce = db.query(Ingredient).filter(Ingredient.id == payload.sauce_id).first() if payload.sauce_id else None
    toppings = (
        db.query(Ingredient).filter(Ingredient.id.in_(payload.topping_ids)).all()
        if payload.topping_ids
        else []
    )

    custom = CustomDish(
        user_id=current_user.id,
        dish_id=base_dish.id,
        name=payload.name or "Моя пицца",
        total_price=Decimal(str(payload.total_price)),
        size_name=size.name if size else None,
        dough_name=dough.name if dough else None,
        sauce_name=sauce.name if sauce else None,
        toppings_names=[t.name for t in toppings] if toppings else None,
    )
    db.add(custom)
    db.flush()

    for modifier_id in filter(None, [payload.size_id, payload.dough_id]):
        db.add(CustomDishModifier(custom_dish_id=custom.id, modifier_id=modifier_id, quantity=1))

    db.commit()
    return {"id": custom.id}


@router.get("/my-pizzas", response_model=list[CustomPizzaResponse])
def get_my_pizzas(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustomPizzaResponse]:
    pizzas = (
        db.query(CustomDish)
        .filter(CustomDish.user_id == current_user.id)
        .order_by(CustomDish.created_at.desc())
        .all()
    )
    return [_serialize_pizza(p) for p in pizzas]


@router.delete("/my-pizzas/{pizza_id}", status_code=204)
def delete_my_pizza(
    pizza_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    pizza = (
        db.query(CustomDish)
        .filter(CustomDish.id == pizza_id, CustomDish.user_id == current_user.id)
        .first()
    )
    if not pizza:
        raise HTTPException(status_code=404, detail="Pizza not found")

    db.query(OrderItem).filter(OrderItem.custom_dish_id == pizza_id).update({"custom_dish_id": None})
    db.query(CustomDishModifier).filter(CustomDishModifier.custom_dish_id == pizza_id).delete()
    db.delete(pizza)
    db.commit()
