import { apiClient } from "./client";

export type AddressData = {
  id: number;
  city: string;
  street: string;
  house: string;
  apartment: string | null;
  is_default: boolean;
};

export type OrderItem = {
  id: number;
  dish_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  modifiers: string[] | null;
};

export type Order = {
  id: number;
  status: string;
  total_price: number;
  delivery_fee: number;
  payment_method: string;
  comment: string | null;
  created_at: string;
  address: AddressData;
  items: OrderItem[];
};

type NewAddressInput = {
  city: string;
  street: string;
  house: string;
  apartment?: string;
};

type CreateOrderPayload = {
  address_id?: number;
  new_address?: NewAddressInput;
  payment_method: string;
  comment?: string;
  delivery_fee: number;
};

export const getAddressesApi = (): Promise<AddressData[]> =>
  apiClient.get<AddressData[]>("/addresses").then((r) => r.data);

export const deleteAddressApi = (id: number): Promise<void> =>
  apiClient.delete(`/addresses/${id}`).then(() => undefined);

export const createOrderApi = (payload: CreateOrderPayload): Promise<Order> =>
  apiClient.post<Order>("/orders", payload).then((r) => r.data);

export const getOrdersApi = (): Promise<Order[]> =>
  apiClient.get<Order[]>("/orders").then((r) => r.data);

export const getOrderApi = (id: number): Promise<Order> =>
  apiClient.get<Order>(`/orders/${id}`).then((r) => r.data);
