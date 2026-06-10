import { apiClient } from "./client";

export type ModifierOption = {
  id: number;
  name: string;
  price: number;
  type: string;
};

export type IngredientOption = {
  id: number;
  name: string;
  price: number;
  unit: string;
};

export type ToppingGroups = {
  Сыры: IngredientOption[];
  Мясо: IngredientOption[];
  Овощи: IngredientOption[];
};

export type ConstructorOptions = {
  base_dish_id: number;
  sizes: ModifierOption[];
  doughs: ModifierOption[];
  sauces: IngredientOption[];
  toppings: ToppingGroups;
};

export type SaveCustomPizzaPayload = {
  name: string;
  size_id?: number;
  dough_id?: number;
  sauce_id?: number;
  topping_ids?: number[];
  total_price: number;
};

export type CustomPizza = {
  id: number;
  name: string;
  total_price: number;
  created_at: string;
  base_dish_id: number;
  size: string | null;
  dough: string | null;
  sauce: string | null;
  toppings: string[];
};

export async function getConstructorOptionsApi(): Promise<ConstructorOptions> {
  const { data } = await apiClient.get<ConstructorOptions>("/constructor/options");
  return data;
}

export async function saveCustomPizzaApi(payload: SaveCustomPizzaPayload): Promise<{ id: number }> {
  const { data } = await apiClient.post<{ id: number }>("/constructor/save", payload);
  return data;
}

export async function getMyPizzasApi(): Promise<CustomPizza[]> {
  const { data } = await apiClient.get<CustomPizza[]>("/constructor/my-pizzas");
  return data;
}

export async function deleteMyPizzaApi(id: number): Promise<void> {
  await apiClient.delete(`/constructor/my-pizzas/${id}`);
}
