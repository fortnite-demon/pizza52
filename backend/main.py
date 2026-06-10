from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, cart, health, menu
from app.routers.admin import router as admin_router
from app.routers.constructor import router as constructor_router
from app.routers.orders import router_addresses, router_orders

app = FastAPI(title="Pizza52 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://pizza52.pro",
        "https://www.pizza52.pro",
        "http://pizza52.pro",
        "http://www.pizza52.pro",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(health.router)
app.include_router(auth.router, prefix="/api")
app.include_router(menu.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(router_addresses, prefix="/api")
app.include_router(router_orders, prefix="/api")
app.include_router(constructor_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Pizza52 API is running"}
