import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoriesApi, getDishesApi } from "../api/menu";
import DishCard from "../components/DishCard";
import DishModal from "../components/DishModal";
import type { Dish, MenuCategory } from "../types";

export default function HomePage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingDishes, setIsLoadingDishes] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = await getCategoriesApi();
        setCategories(data);
      } catch {
        setError("Не удалось загрузить категории.");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    void fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDishes = async () => {
      setIsLoadingDishes(true);
      try {
        const data = await getDishesApi(selectedCategoryId ?? undefined);
        setDishes(data);
      } catch {
        setError("Не удалось загрузить блюда.");
      } finally {
        setIsLoadingDishes(false);
      }
    };
    void fetchDishes();
  }, [selectedCategoryId]);

  const categoryFilters = useMemo(
    () => [{ id: null as number | null, name: "Все" }, ...categories],
    [categories]
  );

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-8">
      <section className="mx-auto mb-8 max-w-6xl rounded-3xl bg-gradient-to-r from-red-600 to-red-500 p-8 text-white">
        <h1 className="mb-3 max-w-2xl text-3xl font-bold sm:text-4xl">
          Настоящая сосновская пицца с доставкой
        </h1>
        <p className="mb-6 max-w-2xl text-red-100">
          Выбирай готовые хиты или собери идеальную пиццу в конструкторе Pizza52.
        </p>
        <Link
          to="/constructor"
          className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Собрать свою пиццу
        </Link>
      </section>

      <section className="mx-auto mb-6 max-w-6xl">
        {isLoadingCategories ? (
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categoryFilters.map((category) => {
              const isActive = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id ?? "all"}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-red-600 text-white"
                      : "bg-white text-slate-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl">
        {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

        {isLoadingDishes ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 h-44 animate-pulse rounded-xl bg-slate-200" />
                <div className="mb-2 h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="mb-4 h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} onOpen={setSelectedDishId} />
            ))}
          </div>
        )}
      </section>

      {selectedDishId !== null && (
        <DishModal dishId={selectedDishId} onClose={() => setSelectedDishId(null)} />
      )}
    </main>
  );
}
