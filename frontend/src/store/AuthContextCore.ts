import { createContext } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loginCustomer: () => void;
  loginAdmin: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
