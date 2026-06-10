import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import CartItemImage from "../components/CartItemImage";
import { getOrderApi, type Order } from "../api/orders";
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    getOrderApi(Number(id))
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, id]);

  if (!isAuthenticated && token) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-slate-500">Загрузка...</p>
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to={`/login?redirect=/orders/${id}`} replace />;

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4">
          <div className="h-9 w-44 animate-pulse rounded-lg bg-white" />
          <div className="h-10 w-56 animate-pulse rounded-lg bg-white" />
          <div className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (notFound || !order) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-6xl">🔍</span>
        <h2 className="text-xl font-bold text-slate-900">Заказ не найден</h2>
        <Link to="/orders" className="font-medium text-red-600 hover:underline">
          Назад к заказам
        </Link>
      </main>
    );
  }

  const status = STATUS_META[order.status] ?? {
    label: order.status,
    className: "bg-slate-100 text-slate-600",
  };
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { address } = order;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to="/orders"
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-red-600"
      >
        ← Назад к заказам
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Заказ №{order.id}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Meta info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-slate-500">Дата заказа</dt>
              <dd className="text-right font-medium text-slate-800">{formatDate(order.created_at)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-slate-500">Адрес доставки</dt>
              <dd className="text-right font-medium text-slate-800">
                ул. {address.street}, д. {address.house}
                {address.apartment ? `, кв. ${address.apartment}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-slate-500">Способ оплаты</dt>
              <dd className="font-medium text-slate-800">
                {order.payment_method === "card" ? "💳 Картой онлайн" : "💵 Наличными курьеру"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Items */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900">Состав заказа</h2>
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <CartItemImage
                    imageUrl={item.image_url}
                    name={item.name}
                    modifiers={item.modifiers ?? undefined}
                    size={56}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-400">{item.modifiers.join(", ")}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold text-slate-900">{item.price * item.quantity} ₽</p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-slate-400">{item.price} ₽ × {item.quantity}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Сумма товаров</span>
              <span>{itemsTotal} ₽</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Доставка</span>
              <span>
                {order.delivery_fee === 0 ? (
                  <span className="font-medium text-green-600">Бесплатно</span>
                ) : (
                  `${order.delivery_fee} ₽`
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
              <span>Итого</span>
              <span>{order.total_price} ₽</span>
            </div>
          </div>
        </section>

        {/* Comment */}
        {order.comment && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-slate-900">Комментарий</h2>
            <p className="text-sm text-slate-600">{order.comment}</p>
          </section>
        )}
      </div>
    </main>
  );
}
