import { apiClient } from "./client";
import type { UserRole } from "../types";

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  is_blocked: boolean;
  created_at: string;
};

export const getUsersApi = (): Promise<AdminUser[]> =>
  apiClient.get<AdminUser[]>("/admin/users").then((r) => r.data);

export const updateUserRoleApi = (userId: number, role: UserRole): Promise<AdminUser> =>
  apiClient.patch<AdminUser>(`/admin/users/${userId}/role`, { role }).then((r) => r.data);

export const toggleUserBlockApi = (userId: number, isBlocked: boolean): Promise<AdminUser> =>
  apiClient.patch<AdminUser>(`/admin/users/${userId}/block`, { is_blocked: isBlocked }).then((r) => r.data);
