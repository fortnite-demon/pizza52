import { apiClient } from "./client";
import type { AuthUser } from "../types";

type AuthPayload = {
  email: string;
  password: string;
};

type RegisterPayload = AuthPayload & {
  name: string;
  phone?: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
};

export type UpdateProfileResponse = AuthUser & {
  new_token: string | null;
};

export async function loginApi(payload: AuthPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<UpdateProfileResponse> {
  const { data } = await apiClient.put<UpdateProfileResponse>("/auth/me", payload);
  return data;
}

export async function updatePasswordApi(payload: {
  current_password: string;
  new_password: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>("/auth/password", payload);
  return data;
}
