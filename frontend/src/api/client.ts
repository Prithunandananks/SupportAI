import axios from "axios";
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach the access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    const isAuthRoute = config.url?.includes("/auth/login") || config.url?.includes("/auth/register");
    if (token && !isAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Clear token on 401 Unauthorized
      if (
        error.response?.status === 401 &&
        !error.config.url?.includes("/auth/login")
      ) {
        localStorage.removeItem("access_token");
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
