import axios from "axios";
import { clearSession, getToken } from "../features/auth/authStorage";

export const api = axios.create({ baseURL: "http://localhost:8080/api" });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes("/auth/login");

    if (err.response?.status === 401 && !isLogin) {
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const mensaje: string =
      err.response?.data?.error ?? "No se pudo conectar con el servidor";
    return Promise.reject(new Error(mensaje));
  }
);