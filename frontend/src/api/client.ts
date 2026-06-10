import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("pizza52_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const BLOCKED_DETAIL = "Учётная запись заблокирована";

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const detail: unknown = error.response?.data?.detail;
    if (
      error.response?.status === 403 &&
      typeof detail === "string" &&
      detail === BLOCKED_DETAIL &&
      localStorage.getItem("pizza52_token")
    ) {
      const { useAuthStore } = await import("../store/useAuthStore");
      useAuthStore.getState().logout();
      const { useToastStore } = await import("../store/useToastStore");
      useToastStore.getState().addToast("Ваша учётная запись заблокирована", "error");
    }
    return Promise.reject(error);
  }
);
