import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import CartItemImage from "../components/CartItemImage";
import { getOrdersApi, type Order } from "../api/orders";
import { useAuthStore } from "../store/useAuthStore";

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending:    { label: "Принят",        className: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Подтверждён",   className: "bg-blue-100 text-blue-700" },
  cooking:    { label: "Готовится",     className: "bg-orange-100 text-orange-700" },
  delivering: { label: "В пути",        className: "bg-purple-100 text-purple-700" },
  delivered:  { label: "Доставлен",     className: "bg-green-100 text-green-700" },
  cancelled:  { label: "Отменён",       className: "bg-red-100 text-red-700" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${date.replace(" г.", "")}, ${time}`;
}

export default function OrdersPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    getOrdersApi()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  // token present but auth not resolved yet — still bootstrapping
  if (!isAuthenticated && token) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-slate-500">Загрузка...</p>
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login?redirect=/orders" replace />;

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Мои заказы</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-7xl">📋</span>
        <h2 className="text-2xl font-bold text-slate-900">Заказов пока нет</h2>
        <p className="text-slate-500">Оформите первый заказ прямо сейчас</p>
        <Link
          to="/"
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Перейти в меню
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Мои заказы</h1>
      <ul className="space-y-4">
        {orders.map((order) => {
          const status = STATUS_META[order.status] ?? {
            label: order.status,
            className: "bg-slate-100 text-slate-600",
          };
          return (
            <li
              key={order.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900">Заказ №{order.id}</span>
                  <span className="ml-3 text-sm text-slate-500">{formatDate(order.created_at)}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>

              <ul className="mb-4 space-y-1.5">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <CartItemImage
                        imageUrl={item.image_url}
                        name={item.name}
                        modifiers={item.modifiers ?? undefined}
                        size={32}
                      />
                    </div>
                    <span className="text-sm text-slate-600">
                      {item.name} × {item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">{order.total_price} ₽</span>
                <Link
                  to={`/orders/${order.id}`}
                  className="rounded-lg border border-red-600 px-4 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Подробнее
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
