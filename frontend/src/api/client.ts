import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:8080/api" });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const mensaje: string =
      err.response?.data?.error ?? "No se pudo conectar con el servidor";
    return Promise.reject(new Error(mensaje));
  }
);