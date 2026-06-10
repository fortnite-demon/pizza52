import { Link, useNavigate } from "react-router-dom";
import CartItemImage from "../components/CartItemImage";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";

export default function CartPage() {
  const { items, totalPrice, totalItems, removeItem, updateQuantity, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-4">
        <span className="text-7xl">🛒</span>
        <h2 className="text-2xl font-bold text-slate-900">Корзина пуста</h2>
        <p className="text-slate-500">Добавьте что-нибудь вкусное из меню</p>
        <Link
          to="/"
          className="mt-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Перейти в меню
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Корзина <span className="text-slate-400">({totalItems})</span>
        </h1>
        <button
          onClick={() => void clearCart()}
          className="text-sm text-slate-500 hover:text-red-600"
        >
          Очистить
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Item list */}
        <div className="flex-1 space-y-3">
          {items.map((item, index) => (
            <div
              key={`${item.dishId}-${index}`}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                <CartItemImage
                  imageUrl={item.imageUrl}
                  name={item.name}
                  modifiers={item.modifiers}
                  size={56}
                />
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.modifiers.join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {item.price} ₽ / шт
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (item.quantity === 1) {
                          void removeItem(index);
                        } else {
                          void updateQuantity(index, item.quantity - 1);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => void updateQuantity(index, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="ml-auto text-sm font-bold text-slate-900">
                    {item.price * item.quantity} ₽
                  </span>
                </div>
              </div>

              <button
                onClick={() => void removeItem(index)}
                className="self-start text-slate-300 transition hover:text-red-500"
                aria-label="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-80">
          <div className="sticky top-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Ваш заказ</h2>

            <ul className="mb-4 space-y-2 border-b border-slate-100 pb-4">
              {items.map((item, index) => (
                <li key={`sum-${item.dishId}-${index}`} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="ml-1 text-slate-400">× {item.quantity}</span>
                    )}
                  </span>
                  <span className="font-medium text-slate-900">
                    {item.price * item.quantity} ₽
                  </span>
                </li>
              ))}
            </ul>

            <div className="mb-5 flex justify-between text-base font-bold text-slate-900">
              <span>Итого</span>
              <span>{totalPrice} ₽</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              Оформить заказ
            </button>

            <p className="mt-3 text-center text-xs text-slate-400">
              Доставка рассчитывается при оформлении
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
