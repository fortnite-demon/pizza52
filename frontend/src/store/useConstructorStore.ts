import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConstructorOptions, IngredientOption, ModifierOption } from "../api/constructor";

const BASE_PRICE = 490;

type ConstructorState = {
  options: ConstructorOptions | null;
  isLoading: boolean;
  currentStep: number;
  selectedSize: ModifierOption | null;
  selectedDough: ModifierOption | null;
  selectedSauce: IngredientOption | null;
  selectedToppings: IngredientOption[];
  pizzaName: string;
  totalPrice: number;
  setOptions: (options: ConstructorOptions) => void;
  setLoading: (loading: boolean) => void;
  setStep: (step: number) => void;
  setSize: (size: ModifierOption) => void;
  setDough: (dough: ModifierOption) => void;
  setSauce: (sauce: IngredientOption | null) => void;
  toggleTopping: (topping: IngredientOption) => void;
  setPizzaName: (name: string) => void;
  resetConstructor: () => void;
};

function calcPrice(
  size: ModifierOption | null,
  dough: ModifierOption | null,
  toppings: IngredientOption[]
): number {
  return (
    BASE_PRICE +
    (size?.price ?? 0) +
    (dough?.price ?? 0) +
    toppings.reduce((sum, t) => sum + t.price, 0)
  );
}

export const useConstructorStore = create<ConstructorState>()(
  persist(
    (set, get) => ({
      options: null,
      isLoading: false,
      currentStep: 0,
      selectedSize: null,
      selectedDough: null,
      selectedSauce: null,
      selectedToppings: [],
      pizzaName: "Моя пицца",
      totalPrice: BASE_PRICE,

      setOptions: (options) =>
        set((state) => {
          const size = state.selectedSize ?? options.sizes[0] ?? null;
          const dough = state.selectedDough ?? options.doughs[0] ?? null;
          return {
            options,
            selectedSize: size,
            selectedDough: dough,
            selectedSauce: state.selectedSauce,
            totalPrice: calcPrice(size, dough, state.selectedToppings),
          };
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setStep: (currentStep) => set({ currentStep }),

      setSize: (size) =>
        set((state) => ({
          selectedSize: size,
          totalPrice: calcPrice(size, state.selectedDough, state.selectedToppings),
        })),

      setDough: (dough) =>
        set((state) => ({
          selectedDough: dough,
          totalPrice: calcPrice(state.selectedSize, dough, state.selectedToppings),
        })),

      setSauce: (sauce) => set({ selectedSauce: sauce }),

      toggleTopping: (topping) =>
        set((state) => {
          const exists = state.selectedToppings.some((t) => t.id === topping.id);
          const toppings = exists
            ? state.selectedToppings.filter((t) => t.id !== topping.id)
            : [...state.selectedToppings, topping];
          return {
            selectedToppings: toppings,
            totalPrice: calcPrice(state.selectedSize, state.selectedDough, toppings),
          };
        }),

      setPizzaName: (pizzaName) => set({ pizzaName }),

      resetConstructor: () =>
        set((state) => {
          const size = state.options?.sizes[0] ?? null;
          const dough = state.options?.doughs[0] ?? null;
          return {
            currentStep: 0,
            selectedSize: size,
            selectedDough: dough,
            selectedSauce: null,
            selectedToppings: [],
            pizzaName: "Моя пицца",
            totalPrice: calcPrice(size, dough, []),
          };
        }),
    }),
    {
      name: "pizza52-constructor",
      partialize: (state) => ({ currentStep: state.currentStep }),
    }
  )
);
