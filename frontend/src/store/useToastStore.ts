import { create } from "zustand";

export type ToastType = "success" | "error";

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
  removing: boolean;
};

type ToastState = {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: number) => void;
};

let nextId = 0;

const DURATION = 3000;
const EXIT_LEAD = 300;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type, removing: false }] }));

    setTimeout(() => {
      set((s) => ({
        toasts: s.toasts.map((t) => (t.id === id ? { ...t, removing: true } : t)),
      }));
    }, DURATION - EXIT_LEAD);

    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, DURATION);
  },

  removeToast: (id) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, removing: true } : t)),
    }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, EXIT_LEAD);
  },
}));
