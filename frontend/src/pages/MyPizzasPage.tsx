import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { deleteMyPizzaApi, getMyPizzasApi, type CustomPizza } from "../api/constructor";
import PizzaPreview from "../components/PizzaPreview";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { useToastStore } from "../store/useToastStore";

export default function MyPizzasPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  const [pizzas, setPizzas] = useState<CustomPizza[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getMyPizzasApi()
      .then(setPizzas)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated && token) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-slate-500">Загрузка...</p>
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login?redirect=/my-pizzas" replace />;

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Мои пиццы</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-white shadow-sm" />
          ))}
        </div>
      </main>
    );
  }

  if (pizzas.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="text-7xl">🍕</span>
        <h2 className="text-2xl font-bold text-slate-900">Вы ещё не сохранили ни одной пиццы</h2>
        <p className="text-slate-500">Создайте свою пиццу в конструкторе и сохраните её</p>
        <Link
          to="/constructor"
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Перейти в конструктор
        </Link>
      </main>
    );
  }

  const handleAddToCart = async (pizza: CustomPizza) => {
    const modifiers = [pizza.size, pizza.dough, pizza.sauce, ...pizza.toppings].filter(
      (v): v is string => v !== null && v !== undefined
    );
    await addItem({
      dishId: pizza.base_dish_id,
      name: pizza.name,
      price: pizza.total_price,
      quantity: 1,
      modifiers: modifiers.length ? modifiers : undefined,
    });
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteMyPizzaApi(id);
      setPizzas((prev) => prev.filter((p) => p.id !== id));
      addToast("Пицца удалена", "success");
    } catch {
      addToast("Не удалось удалить пиццу", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Мои пиццы</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pizzas.map((pizza) => {
          const modifierLines = [
            pizza.size && `Размер: ${pizza.size}`,
            pizza.dough && `Тесто: ${pizza.dough}`,
            pizza.sauce && `Соус: ${pizza.sauce}`,
            pizza.toppings.length > 0 && `Начинка: ${pizza.toppings.join(", ")}`,
          ].filter(Boolean) as string[];

          return (
            <div
              key={pizza.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex justify-center">
                <PizzaPreview
                  sauceName={pizza.sauce}
                  toppingNames={pizza.toppings}
                  size={160}
                />
              </div>

              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900">{pizza.name}</h3>
                <span className="shrink-0 text-lg font-bold text-slate-900">{pizza.total_price} ₽</span>
              </div>

              {modifierLines.length > 0 && (
                <ul className="mb-4 mt-2 space-y-0.5">
                  {modifierLines.map((line) => (
                    <li key={line} className="text-xs text-slate-500">{line}</li>
                  ))}
                </ul>
              )}

              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => void handleAddToCart(pizza)}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  В корзину
                </button>
                <button
                  onClick={() => void handleDelete(pizza.id)}
                  disabled={deletingId === pizza.id}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-700 disabled:opacity-50"
                >
                  {deletingId === pizza.id ? "..." : "Удалить"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
