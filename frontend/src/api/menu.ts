import type { Dish, DishDetails, MenuCategory } from "../types";
import { apiClient } from "./client";

export async function getCategoriesApi(): Promise<MenuCategory[]> {
  const { data } = await apiClient.get<MenuCategory[]>("/menu/categories");
  return data;
}

export async function getDishesApi(categoryId?: number): Promise<Dish[]> {
  const { data } = await apiClient.get<Dish[]>("/menu/dishes", {
    params: categoryId ? { category_id: categoryId } : undefined,
  });
  return data;
}

export async function getDishApi(id: number): Promise<DishDetails> {
  const { data } = await apiClient.get<DishDetails>(`/menu/dishes/${id}`);
  return data;
}
