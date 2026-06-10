from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Address, CartItem, Dish, Order, OrderItem, User
from app.routers.auth import get_current_user

router_addresses = APIRouter(prefix="/addresses", tags=["addresses"])
router_orders = APIRouter(prefix="/orders", tags=["orders"])


# ---------- Schemas ----------

class AddressResponse(BaseModel):
    id: int
    city: str
    street: str
    house: str
    apartment: str | None
    is_default: bool


class NewAddressInput(BaseModel):
    city: str
    street: str
    house: str
    apartment: str | None = None


class OrderItemResponse(BaseModel):
    id: int
    dish_id: int
    name: str
    custom_name: str | None
    price: float
    quantity: int
    image_url: str | None
    modifiers: list[str] | None = None


class OrderResponse(BaseModel):
    id: int
    status: str
    total_price: float
    delivery_fee: float
    payment_method: str
    comment: str | None
    created_at: str
    address: AddressResponse
    items: list[OrderItemResponse]


class CreateOrderRequest(BaseModel):
    address_id: int | None = None
    new_address: NewAddressInput | None = None
    payment_method: str = "cash"
    comment: str | None = None
    delivery_fee: int = 0


# ---------- Helpers ----------

def _serialize_address(a: Address) -> AddressResponse:
    return AddressResponse(
        id=a.id,
        city=a.city,
        street=a.street,
        house=a.house,
        apartment=a.apartment,
        is_default=a.is_default,
    )


def _serialize_order(order: Order, db: Session) -> OrderResponse:
    address = db.query(Address).filter(Address.id == order.address_id).first()
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()

    item_responses = []
    for oi in order_items:
        dish = db.query(Dish).filter(Dish.id == oi.dish_id).first()
        item_responses.append(
            OrderItemResponse(
                id=oi.id,
                dish_id=oi.dish_id,
                name=oi.custom_name if oi.custom_name else (dish.name if dish else "Блюдо удалено"),
                custom_name=oi.custom_name,
                price=float(oi.price),
                quantity=oi.quantity,
                image_url=dish.image_url if dish else None,
                modifiers=oi.modifiers,
            )
        )

    return OrderResponse(
        id=order.id,
        status=order.status,
        total_price=float(order.total_price),
        delivery_fee=float(order.delivery_fee),
        payment_method=order.payment_method,
        comment=order.comment,
        created_at=order.created_at.isoformat(),
        address=_serialize_address(address) if address else AddressResponse(
            id=0, city="", street="", house="", apartment=None, is_default=False
        ),
        items=item_responses,
    )


# ---------- Address endpoints ----------

@router_addresses.get("", response_model=list[AddressResponse])
def get_addresses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AddressResponse]:
    addresses = (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_default.desc(), Address.id.asc())
        .all()
    )
    return [_serialize_address(a) for a in addresses]


@router_addresses.delete("/{address_id}", status_code=204)
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    address = (
        db.query(Address)
        .filter(Address.id == address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(status_code=404, detail="Адрес не найден")
    db.delete(address)
    db.commit()


# ---------- Order endpoints ----------

@router_orders.post("", response_model=OrderResponse)
def create_order(
    payload: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    if payload.address_id is None and payload.new_address is None:
        raise HTTPException(status_code=422, detail="Укажите адрес доставки")

    # Resolve address
    if payload.new_address:
        address = Address(
            user_id=current_user.id,
            city=payload.new_address.city,
            street=payload.new_address.street,
            house=payload.new_address.house,
            apartment=payload.new_address.apartment,
            is_default=False,
        )
        db.add(address)
        db.flush()
    else:
        address = (
            db.query(Address)
            .filter(Address.id == payload.address_id, Address.user_id == current_user.id)
            .first()
        )
        if not address:
            raise HTTPException(status_code=404, detail="Адрес не найден")

    # Pull cart items
    cart_items = (
        db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Корзина пуста")

    total_price = sum(
        Decimal(str(ci.price)) * ci.quantity for ci in cart_items
    ) + Decimal(str(payload.delivery_fee))

    order = Order(
        user_id=current_user.id,
        address_id=address.id,
        status="pending",
        total_price=total_price,
        delivery_fee=payload.delivery_fee,
        payment_method=payload.payment_method,
        comment=payload.comment,
    )
    db.add(order)
    db.flush()

    for ci in cart_items:
        db.add(
            OrderItem(
                order_id=order.id,
                dish_id=ci.dish_id,
                custom_name=ci.custom_name,
                quantity=ci.quantity,
                price=ci.price,
                modifiers=ci.modifiers,
            )
        )

    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    db.refresh(order)

    return _serialize_order(order, db)


@router_orders.get("", response_model=list[OrderResponse])
def get_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_serialize_order(o, db) for o in orders]


@router_orders.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return _serialize_order(order, db)
