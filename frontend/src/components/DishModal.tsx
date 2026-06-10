import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../api/client";
import { getDishApi } from "../api/menu";
import { useCartStore } from "../store/useCartStore";
import type { DishDetails, DishModifier } from "../types";

type DishModalProps = {
  dishId: number;
  onClose: () => void;
};

const TOPPING_GROUPS: Record<string, string[]> = {
  "Сыры": ["моцарелла", "пармезан", "чеддер", "гауда", "сыр"],
  "Мясо": ["пепперони", "ветчина", "курица", "бекон", "мясо"],
  "Овощи": ["томаты", "перец", "грибы", "лук", "маслины", "ананас", "овощ"],
};

function getDishEmoji(dish: DishDetails): string {
  if (dish.is_constructable) return "🍕";
  if (dish.category_name === "Закуски") return "🍟";
  if (dish.category_name === "Напитки") return "🥤";
  if (dish.category_name === "Десерты") return "🍰";
  return "🍽️";
}

function groupToppings(toppings: DishModifier[]) {
  const grouped: Record<string, DishModifier[]> = { "Сыры": [], "Мясо": [], "Овощи": [] };
  const other: DishModifier[] = [];

  toppings.forEach((topping) => {
    const lowerName = topping.name.toLowerCase();
    const groupName = Object.entries(TOPPING_GROUPS).find(([, keywords]) =>
      keywords.some((keyword) => lowerName.includes(keyword))
    )?.[0];
    if (groupName) grouped[groupName].push(topping);
    else other.push(topping);
  });

  if (other.length) grouped["Овощи"] = [...grouped["Овощи"], ...other];
  return grouped;
}

export default function DishModal({ dishId, onClose }: DishModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [dish, setDish] = useState<DishDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<number[]>([]);

  useEffect(() => {
    const fetchDish = async () => {
      setLoading(true);
      try {
        const data = await getDishApi(dishId);
        setDish(data);
        const firstSize = data.modifiers.find((modifier) => modifier.type === "size");
        setSelectedSizeId(firstSize?.id ?? null);
      } finally {
        setLoading(false);
      }
    };
    void fetchDish();
  }, [dishId]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const sizes = useMemo(
    () => dish?.modifiers.filter((modifier) => modifier.type === "size") ?? [],
    [dish]
  );
  const toppings = useMemo(
    () => dish?.modifiers.filter((modifier) => modifier.type === "topping") ?? [],
    [dish]
  );
  const groupedToppings = useMemo(() => groupToppings(toppings), [toppings]);

  const totalPrice = useMemo(() => {
    if (!dish) return 0;
    const sizeExtra = sizes.find((size) => size.id === selectedSizeId)?.price ?? 0;
    const toppingsExtra = toppings
      .filter((item) => selectedToppings.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
    return dish.base_price + sizeExtra + toppingsExtra;
  }, [dish, selectedSizeId, selectedToppings, sizes, toppings]);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        onClick={(event) => event.stopPropagation()}
        className="modal-appear max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl"
      >
        {loading || !dish ? (
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div>
              <button
                onClick={onClose}
                className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
              <div className="mb-5 flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-white">
                {dish.image_url ? (
                  <img src={`${API_BASE_URL}${dish.image_url}`} alt={dish.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-7xl">{getDishEmoji(dish)}</span>
                )}
              </div>

              {dish.ingredients.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Состав
                  </h4>
                  <p className="text-sm text-slate-700">
                    {dish.ingredients.map((item) => item.name).join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h2 className="mb-2 text-3xl font-bold text-slate-900">{dish.name}</h2>
              <p className="mb-6 text-slate-600">
                {dish.description || "Вкусное блюдо из меню Pizza52"}
              </p>

              {dish.is_constructable && sizes.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Размер
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((size) => {
                      const active = size.id === selectedSizeId;
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSizeId(size.id)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                            active
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 text-slate-700 hover:border-red-300"
                          }`}
                        >
                          {size.name}
                          <div className="text-xs">{size.price > 0 ? `+${size.price} руб` : "+0 руб"}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {dish.is_constructable && toppings.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Дополнительные топпинги
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(groupedToppings).map(([groupName, items]) =>
                      items.length ? (
                        <div key={groupName}>
                          <h4 className="mb-2 text-sm font-semibold text-slate-700">{groupName}</h4>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <label key={item.id} className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedToppings.includes(item.id)}
                                    onChange={(event) =>
                                      setSelectedToppings((prev) =>
                                        event.target.checked
                                          ? [...prev, item.id]
                                          : prev.filter((id) => id !== item.id)
                                      )
                                    }
                                    className="h-4 w-4 accent-red-600"
                                  />
                                  {item.name}
                                </span>
                                <span className="font-semibold text-slate-700">+{item.price} руб</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {!dish.is_constructable && dish.category_name === "Напитки" && sizes.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Объем
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((size) => {
                      const active = size.id === selectedSizeId;
                      return (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSizeId(size.id)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                            active
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-slate-300 text-slate-700 hover:border-red-300"
                          }`}
                        >
                          {size.name}
                          <div className="text-xs">{size.price > 0 ? `+${size.price} руб` : "+0 руб"}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className="mt-auto border-t border-slate-200 pt-4">
                <p className="mb-3 text-xl font-bold text-slate-900">Итог: {totalPrice} руб</p>
                <button
                  onClick={() => {
                    const selectedSize = sizes.find((size) => size.id === selectedSizeId);
                    const selectedToppingNames = toppings
                      .filter((item) => selectedToppings.includes(item.id))
                      .map((item) => item.name);
                    const modifiers = [
                      ...(selectedSize ? [selectedSize.name] : []),
                      ...selectedToppingNames,
                    ];
                    addItem({
                      dishId: dish.id,
                      name: dish.name,
                      price: totalPrice,
                      quantity: 1,
                      imageUrl: dish.image_url ?? undefined,
                      modifiers: modifiers.length ? modifiers : undefined,
                    });
                    onClose();
                  }}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"
                >
                  В корзину
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
