import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, type User } from "../services/auth.service";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: URLSearchParams) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const fetchedUser = await authService.getCurrentUser();
          setUser(fetchedUser);
          
          // If they are admin and go to root/login, redirect to admin
          if (fetchedUser.role === "Admin" && (location.pathname === "/" || location.pathname === "/login")) {
             navigate("/admin/dashboard");
          } else if (fetchedUser.role === "Customer" && (location.pathname === "/" || location.pathname === "/login" || location.pathname.startsWith("/admin"))) {
             navigate("/chat");
          }
        } catch (err) {
          console.error("Failed to fetch user on init:", err);
          authService.logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (data: URLSearchParams) => {
    await authService.login(data);
    const fetchedUser = await authService.getCurrentUser();
    setUser(fetchedUser);
    
    if (fetchedUser.role === "Admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/chat");
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
