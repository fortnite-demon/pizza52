import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConstructorOptionsApi, saveCustomPizzaApi } from "../api/constructor";
import PizzaPreview from "../components/PizzaPreview";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { useConstructorStore } from "../store/useConstructorStore";
import { useToastStore } from "../store/useToastStore";

const SAUCE_COLORS: Record<string, string> = {
  томатный: "#c0392b",
  сливочный: "#f5e6c8",
  барбекю: "#7b3f1a",
  острый: "#e05a1b",
};


const STEPS = ["Размер", "Тесто", "Соус", "Начинка"];

function getPizzaSize(sizeName: string | undefined): number {
  if (!sizeName) return 280;
  if (sizeName.includes("25")) return 220;
  if (sizeName.includes("30")) return 280;
  if (sizeName.includes("35")) return 340;
  return 280;
}


export default function ConstructorPage() {
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addItem } = useCartStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);

  const {
    options,
    isLoading,
    currentStep: step,
    selectedSize,
    selectedDough,
    selectedSauce,
    selectedToppings,
    pizzaName,
    totalPrice,
    setOptions,
    setLoading,
    setStep,
    setSize,
    setDough,
    setSauce,
    toggleTopping,
    setPizzaName,
    resetConstructor,
  } = useConstructorStore();

  useEffect(() => {
    setLoading(true);
    getConstructorOptionsApi()
      .then(setOptions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [setOptions, setLoading]);

  // A step is unlocked if all prior steps have a selection
  function isUnlocked(i: number): boolean {
    if (i === 0) return true;
    if (i === 1) return selectedSize !== null;
    if (i === 2) return selectedSize !== null && selectedDough !== null;
    if (i === 3) return selectedSize !== null && selectedDough !== null;
    return false;
  }

  const handleAddToCart = async () => {
    if (!options) return;
    setIsAdding(true);
    try {
      const modifiers: string[] = [];
      if (selectedSize) modifiers.push(selectedSize.name);
      if (selectedDough) modifiers.push(selectedDough.name);
      if (selectedSauce) modifiers.push(selectedSauce.name);
      selectedToppings.forEach((t) => modifiers.push(t.name));

      await addItem({
        dishId: options.base_dish_id,
        name: pizzaName.trim() || "Моя пицца",
        price: totalPrice,
        quantity: 1,
        modifiers,
      });

      resetConstructor();
      setStep(0);
      navigate("/cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/constructor");
      return;
    }
    if (!options) return;
    setIsSaving(true);
    try {
      await saveCustomPizzaApi({
        name: pizzaName.trim() || "Моя пицца",
        size_id: selectedSize?.id,
        dough_id: selectedDough?.id,
        sauce_id: selectedSauce?.id,
        topping_ids: selectedToppings.map((t) => t.id),
        total_price: totalPrice,
      });
      addToast("Пицца сохранена!", "success");
      resetConstructor();
      navigate("/my-pizzas");
    } catch {
      addToast("Не удалось сохранить пиццу", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const pizzaSize = getPizzaSize(selectedSize?.name);

  if (isLoading) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-slate-500">Загрузка конструктора...</p>
      </main>
    );
  }

  if (!options) {
    return (
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <p className="text-slate-500">Конструктор временно недоступен</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Конструктор пиццы</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left: preview + summary */}
        <div className="lg:w-80">
          <div className="sticky top-4 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <PizzaPreview
              sauceName={selectedSauce?.name ?? null}
              toppingNames={selectedToppings.map((t) => t.name)}
              size={pizzaSize}
            />

            {/* Summary */}
            <div className="w-full space-y-1.5 border-t border-slate-100 pt-4 text-sm">
              {selectedSize && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Размер</span>
                  <span className="font-medium text-slate-800">{selectedSize.name}</span>
                </div>
              )}
              {selectedDough && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Тесто</span>
                  <span className="font-medium text-slate-800">{selectedDough.name}</span>
                </div>
              )}
              {selectedSauce && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Соус</span>
                  <span className="font-medium capitalize text-slate-800">{selectedSauce.name}</span>
                </div>
              )}
              {selectedToppings.length > 0 && (
                <div className="flex flex-wrap justify-between gap-1">
                  <span className="flex-shrink-0 text-slate-400">Начинка</span>
                  <span className="text-right font-medium text-slate-800">
                    {selectedToppings.map((t) => t.name).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Name input */}
            <div className="w-full">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Название пиццы
              </label>
              <input
                type="text"
                value={pizzaName}
                onChange={(e) => setPizzaName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-red-600 focus:ring"
                placeholder="Моя пицца"
                maxLength={50}
              />
            </div>

            {/* Price only */}
            <div className="w-full border-t border-slate-100 pt-3 text-center">
              <span className="text-2xl font-bold text-slate-900">{totalPrice} ₽</span>
            </div>
          </div>
        </div>

        {/* Right: step wizard */}
        <div className="flex-1">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Step tabs */}
            <div className="flex border-b border-slate-200">
              {STEPS.map((label, i) => {
                const unlocked = isUnlocked(i);
                const active = step === i;
                return (
                  <button
                    key={i}
                    onClick={() => unlocked && setStep(i)}
                    disabled={!unlocked}
                    className={`flex flex-1 items-center justify-center gap-1.5 py-3.5 text-sm font-semibold transition ${
                      active
                        ? "border-b-2 border-red-600 text-red-600"
                        : unlocked
                        ? "text-slate-500 hover:text-slate-700"
                        : "cursor-not-allowed text-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                        active
                          ? "bg-red-600 text-white"
                          : unlocked
                          ? "bg-slate-200 text-slate-600"
                          : "bg-slate-100 text-slate-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Step content */}
            <div className="min-h-64 p-5">
              {/* Step 0: Size */}
              {step === 0 && (
                <div>
                  <p className="mb-4 text-sm text-slate-500">Выберите размер пиццы</p>
                  <div className="grid grid-cols-3 gap-3">
                    {options.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSize(size)}
                        className={`rounded-xl border-2 p-4 text-center transition ${
                          selectedSize?.id === size.id
                            ? "border-red-600 bg-red-50"
                            : "border-slate-200 hover:border-red-200"
                        }`}
                      >
                        <div className="text-base font-bold text-slate-900">{size.name}</div>
                        <div className="mt-0.5 text-sm text-slate-500">
                          {size.price > 0 ? `+${size.price} ₽` : "Базовый"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: Dough */}
              {step === 1 && (
                <div>
                  <p className="mb-4 text-sm text-slate-500">Выберите вид теста</p>
                  <div className="grid grid-cols-2 gap-3">
                    {options.doughs.map((dough) => (
                      <button
                        key={dough.id}
                        onClick={() => setDough(dough)}
                        className={`rounded-xl border-2 p-4 text-center transition ${
                          selectedDough?.id === dough.id
                            ? "border-red-600 bg-red-50"
                            : "border-slate-200 hover:border-red-200"
                        }`}
                      >
                        <div className="text-base font-semibold text-slate-900">{dough.name}</div>
                        {dough.price > 0 && (
                          <div className="mt-0.5 text-sm text-slate-500">+{dough.price} ₽</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Sauce */}
              {step === 2 && (
                <div>
                  <p className="mb-4 text-sm text-slate-500">Выберите соус (необязательно)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {options.sauces.map((sauce) => {
                      const color = SAUCE_COLORS[sauce.name.toLowerCase()] ?? "#c0392b";
                      const isSelected = selectedSauce?.id === sauce.id;
                      return (
                        <button
                          key={sauce.id}
                          onClick={() => setSauce(isSelected ? null : sauce)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 transition ${
                            isSelected
                              ? "border-red-600 bg-red-50"
                              : "border-slate-200 hover:border-red-200"
                          }`}
                        >
                          <span
                            className="h-7 w-7 flex-shrink-0 rounded-full border border-slate-200"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-semibold capitalize text-slate-900">
                            {sauce.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Toppings */}
              {step === 3 && (
                <div className="space-y-5">
                  <p className="text-sm text-slate-500">
                    Добавьте начинку{" "}
                    {selectedToppings.length > 0 && (
                      <span className="font-semibold text-red-600">
                        ({selectedToppings.length} выбрано)
                      </span>
                    )}
                  </p>
                  {(["Сыры", "Мясо", "Овощи"] as const).map((group) => {
                    const groupItems = options.toppings[group];
                    if (!groupItems.length) return null;
                    return (
                      <div key={group}>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          {group}
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {groupItems.map((topping) => {
                            const checked = selectedToppings.some((t) => t.id === topping.id);
                            return (
                              <label
                                key={topping.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 transition ${
                                  checked
                                    ? "border-red-600 bg-red-50"
                                    : "border-slate-200 hover:border-red-200"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTopping(topping)}
                                  className="h-4 w-4 accent-red-600"
                                />
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium text-slate-900">
                                    {topping.name}
                                  </div>
                                  <div className="text-xs text-slate-500">+{topping.price} ₽</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nav buttons */}
            <div className="flex justify-between border-t border-slate-100 px-5 py-4">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-30"
              >
                Назад
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!isUnlocked(step + 1)}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Далее
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-70"
                  >
                    {isSaving ? "Сохраняем..." : "Сохранить"}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
                  >
                    {isAdding ? "Добавляем..." : "Готово — в корзину"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
