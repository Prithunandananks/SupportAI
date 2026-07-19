import apiClient from "../api/client";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  name: string;
  role: string;
  is_active: boolean;
}

export interface RawUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
}

const mapUser = (u: RawUser): User => ({
  ...u,
  name: [u.first_name, u.last_name].filter(Boolean).join(" ") || "User",
});

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authService = {
  async register(data: Record<string, unknown>): Promise<User> {
    const response = await apiClient.post<RawUser>("/auth/register", data);
    return mapUser(response.data);
  },

  async login(data: URLSearchParams): Promise<AuthResponse> {
    // login expects application/x-www-form-urlencoded
    const response = await apiClient.post<AuthResponse>("/auth/login", data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.data.access_token) {
      localStorage.setItem("access_token", response.data.access_token);
    }
    if (response.data.refresh_token) {
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<RawUser>("/users/me");
    return mapUser(response.data);
  },

  async getAdmins(): Promise<User[]> {
    const response = await apiClient.get<RawUser[]>("/users/admins");
    return response.data.map(mapUser);
  },

  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>("/auth/reset-password", { token, new_password });
    return response.data;
  },
};
