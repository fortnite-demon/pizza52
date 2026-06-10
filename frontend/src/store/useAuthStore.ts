import { create } from "zustand";
import { getMeApi, loginApi, registerApi } from "../api/auth";
import type { AuthUser } from "../types";

const TOKEN_KEY = "pizza52_token";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  bootstrapAuth: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>, newToken?: string | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: false,
  isLoading: false,

  login: async (payload) => {
    const auth = await loginApi(payload);
    localStorage.setItem(TOKEN_KEY, auth.access_token);
    const me = await getMeApi();
    set({ token: auth.access_token, user: me, isAuthenticated: true });
    const { useCartStore } = await import("./useCartStore");
    await useCartStore.getState().syncWithServer();
  },

  register: async (payload) => {
    const auth = await registerApi(payload);
    localStorage.setItem(TOKEN_KEY, auth.access_token);
    const me = await getMeApi();
    set({ token: auth.access_token, user: me, isAuthenticated: true });
    const { useCartStore } = await import("./useCartStore");
    await useCartStore.getState().syncWithServer();
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false });
    import("./useCartStore").then(({ useCartStore }) => {
      void useCartStore.getState().clearCart();
    });
  },

  bootstrapAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const me = await getMeApi();
      set({ user: me, isAuthenticated: true });
      const { useCartStore } = await import("./useCartStore");
      await useCartStore.getState().loadFromServer();
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data, newToken) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...data } });
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      set({ token: newToken });
    }
  },
}));
