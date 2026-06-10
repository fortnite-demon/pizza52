import { apiClient } from "./client";

export type ServerCartItem = {
  id: number;
  dish_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  modifiers: string[] | null;
};

type AddToCartPayload = {
  dish_id: number;
  name?: string;
  quantity: number;
  price: number;
  modifiers?: string[];
};

type SyncCartPayload = {
  items: {
    dish_id: number;
    name: string;
    price: number;
    quantity: number;
    modifiers?: string[];
  }[];
};

export const getCartApi = (): Promise<ServerCartItem[]> =>
  apiClient.get<ServerCartItem[]>("/cart").then((r) => r.data);

export const addToCartApi = (payload: AddToCartPayload): Promise<ServerCartItem> =>
  apiClient.post<ServerCartItem>("/cart", payload).then((r) => r.data);

export const updateCartItemApi = (itemId: number, quantity: number): Promise<ServerCartItem> =>
  apiClient.put<ServerCartItem>(`/cart/${itemId}`, { quantity }).then((r) => r.data);

export const deleteCartItemApi = (itemId: number): Promise<void> =>
  apiClient.delete(`/cart/${itemId}`).then(() => undefined);

export const clearCartApi = (): Promise<void> =>
  apiClient.delete("/cart").then(() => undefined);

export const syncCartApi = (payload: SyncCartPayload): Promise<ServerCartItem[]> =>
  apiClient.post<ServerCartItem[]>("/cart/sync", payload).then((r) => r.data);
