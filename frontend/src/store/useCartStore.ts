import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useToastStore } from "./useToastStore";
import {
  addToCartApi,
  clearCartApi,
  deleteCartItemApi,
  getCartApi,
  syncCartApi,
  updateCartItemApi,
} from "../api/cart";

export type CartItem = {
  id?: number;
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  modifiers?: string[];
};

const TOKEN_KEY = "pizza52_token";

function hasToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

function calcTotals(items: CartItem[]) {
  return {
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    totalPrice: items.reduce((s, i) => s + i.price * i.quantity, 0),
  };
}

function fromServer(s: Awaited<ReturnType<typeof getCartApi>>[number]): CartItem {
  return {
    id: s.id,
    dishId: s.dish_id,
    name: s.name,
    price: s.price,
    quantity: s.quantity,
    imageUrl: s.image_url ?? undefined,
    modifiers: s.modifiers ?? undefined,
  };
}

type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (index: number) => Promise<void>;
  updateQuantity: (index: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: async (item) => {
        if (hasToken()) {
          try {
            await addToCartApi({
              dish_id: item.dishId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              modifiers: item.modifiers,
            });
            await get().loadFromServer();
            useToastStore.getState().addToast(`«${item.name}» добавлен в корзину`, "success");
            return;
          } catch {}
        }
        const items = [...get().items, item];
        set({ items, ...calcTotals(items) });
        useToastStore.getState().addToast(`«${item.name}» добавлен в корзину`, "success");
      },

      removeItem: async (index) => {
        const target = get().items[index];
        if (!target) return;
        if (hasToken() && target.id) {
          try {
            await deleteCartItemApi(target.id);
            await get().loadFromServer();
            return;
          } catch {}
        }
        const items = get().items.filter((_, i) => i !== index);
        set({ items, ...calcTotals(items) });
      },

      updateQuantity: async (index, quantity) => {
        const target = get().items[index];
        if (!target) return;
        if (hasToken() && target.id) {
          try {
            await updateCartItemApi(target.id, quantity);
            await get().loadFromServer();
            return;
          } catch {}
        }
        const items = get().items.map((item, i) =>
          i === index ? { ...item, quantity } : item
        );
        set({ items, ...calcTotals(items) });
      },

      clearCart: async () => {
        if (hasToken()) {
          try {
            await clearCartApi();
          } catch {}
        }
        set({ items: [], totalItems: 0, totalPrice: 0 });
      },

      syncWithServer: async () => {
        const local = get().items;
        try {
          const synced = await syncCartApi({
            items: local.map((i) => ({
              dish_id: i.dishId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              modifiers: i.modifiers,
            })),
          });
          const items = synced.map(fromServer);
          set({ items, ...calcTotals(items) });
        } catch {}
      },

      loadFromServer: async () => {
        try {
          const items = (await getCartApi()).map(fromServer);
          set({ items, ...calcTotals(items) });
        } catch {}
      },
    }),
    {
      name: "pizza52-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const totals = calcTotals(state.items);
          state.totalItems = totals.totalItems;
          state.totalPrice = totals.totalPrice;
        }
      },
    }
  )
);
