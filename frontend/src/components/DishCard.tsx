import { API_BASE_URL } from "../api/client";
import type { Dish } from "../types";
import { useCartStore } from "../store/useCartStore";

type DishCardProps = {
  dish: Dish;
  onOpen: (dishId: number) => void;
};

export default function DishCard({ dish, onOpen }: DishCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <article
      onClick={() => onOpen(dish.id)}
      className="flex h-full cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-xl bg-white">
        {dish.image_url ? (
          <img src={`${API_BASE_URL}${dish.image_url}`} alt={dish.name} className="h-full w-full object-contain" />
        ) : (
          <div className="text-5xl">🍕</div>
        )}
      </div>

      <h3 className="mb-2 text-lg font-semibold text-slate-900">{dish.name}</h3>
      <p
        className="mb-4 min-h-12 text-sm text-slate-600"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {dish.description || "Авторское блюдо Pizza52"}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-lg font-bold text-slate-900">{dish.base_price} ₽</span>
        <button
          onClick={(event) => {
            event.stopPropagation();
            addItem({
              dishId: dish.id,
              name: dish.name,
              price: dish.base_price,
              quantity: 1,
              imageUrl: dish.image_url ?? undefined,
            });
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          В корзину
        </button>
      </div>
    </article>
  );
}
