import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}

export const mockCustomer: User = {
  id: "cust-1",
  name: "Alex",
  email: "alex@example.com",
  role: "customer",
};

export const mockAdmin: User = {
  id: "admin-1",
  name: "Administrator",
  email: "admin@supportai.com",
  role: "admin",
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loginCustomer: () => void;
  loginAdmin: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Mock auth state with localStorage persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("mock_auth") === "true";
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedRole = localStorage.getItem("mock_auth_role");
    if (savedRole === "admin") return mockAdmin;
    if (savedRole === "customer") return mockCustomer;
    return null;
  });

  const loginCustomer = () => {
    localStorage.setItem("mock_auth", "true");
    localStorage.setItem("mock_auth_role", "customer");
    setUser(mockCustomer);
    setIsAuthenticated(true);
  };

  const loginAdmin = () => {
    localStorage.setItem("mock_auth", "true");
    localStorage.setItem("mock_auth_role", "admin");
    setUser(mockAdmin);
    setIsAuthenticated(true);
  };
  
  const logout = () => {
    localStorage.removeItem("mock_auth");
    localStorage.removeItem("mock_auth_role");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loginCustomer, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
