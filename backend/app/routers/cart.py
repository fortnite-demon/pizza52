from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import CartItem, Dish, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/cart", tags=["cart"])


class CartItemResponse(BaseModel):
    id: int
    dish_id: int
    name: str
    price: float
    quantity: int
    image_url: str | None
    modifiers: list[str] | None


class AddToCartRequest(BaseModel):
    dish_id: int
    name: str | None = None
    quantity: int = 1
    price: float
    modifiers: list[str] | None = None


class UpdateCartItemRequest(BaseModel):
    quantity: int


class SyncItem(BaseModel):
    dish_id: int
    name: str
    price: float
    quantity: int
    modifiers: list[str] | None = None


class SyncCartRequest(BaseModel):
    items: list[SyncItem]


def _serialize(item: CartItem, dish: Dish) -> CartItemResponse:
    return CartItemResponse(
        id=item.id,
        dish_id=item.dish_id,
        name=item.custom_name or dish.name,
        price=float(item.price),
        quantity=item.quantity,
        image_url=dish.image_url,
        modifiers=item.modifiers,
    )


def _get_cart(user_id: int, db: Session) -> list[CartItemResponse]:
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == user_id)
        .order_by(CartItem.created_at.asc())
        .all()
    )
    result = []
    for item in items:
        dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
        if dish:
            result.append(_serialize(item, dish))
    return result


@router.get("", response_model=list[CartItemResponse])
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CartItemResponse]:
    return _get_cart(current_user.id, db)


@router.post("", response_model=CartItemResponse)
def add_to_cart(
    payload: AddToCartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartItemResponse:
    dish = db.query(Dish).filter(Dish.id == payload.dish_id, Dish.is_available.is_(True)).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    cart_item = CartItem(
        user_id=current_user.id,
        dish_id=payload.dish_id,
        custom_name=payload.name or None,
        quantity=payload.quantity,
        price=payload.price,
        modifiers=payload.modifiers,
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return _serialize(cart_item, dish)


@router.put("/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    payload: UpdateCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartItemResponse:
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    item.quantity = payload.quantity
    item.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
    return _serialize(item, dish)


@router.delete("/{item_id}", status_code=204)
def delete_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    db.commit()


@router.delete("", status_code=204)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()


@router.post("/sync", response_model=list[CartItemResponse])
def sync_cart(
    payload: SyncCartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CartItemResponse]:
    for sync_item in payload.items:
        dish = db.query(Dish).filter(Dish.id == sync_item.dish_id, Dish.is_available.is_(True)).first()
        if not dish:
            continue

        existing_items = (
            db.query(CartItem)
            .filter(CartItem.user_id == current_user.id, CartItem.dish_id == sync_item.dish_id)
            .all()
        )

        incoming_mods = sorted(sync_item.modifiers or [])
        matched = next(
            (e for e in existing_items if sorted(e.modifiers or []) == incoming_mods),
            None,
        )

        if matched:
            matched.quantity += sync_item.quantity
            if sync_item.name:
                matched.custom_name = sync_item.name
            matched.updated_at = datetime.utcnow()
        else:
            db.add(CartItem(
                user_id=current_user.id,
                dish_id=sync_item.dish_id,
                custom_name=sync_item.name or None,
                quantity=sync_item.quantity,
                price=sync_item.price,
                modifiers=sync_item.modifiers,
            ))

    db.commit()
    return _get_cart(current_user.id, db)
