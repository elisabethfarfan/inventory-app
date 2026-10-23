import { api } from "./client";
import type { Stock, StockMovement } from "../types/stock";

export const getAllStock = () =>
  api.get<Stock[]>("/stock").then((r) => r.data);

export const registrarEntrada = (productId: number, cantidad: number) =>
  api
    .post<Stock>(`/stock/${productId}/entrada`, null, { params: { cantidad } })
    .then((r) => r.data);

export const registrarSalida = (productId: number, cantidad: number) =>
  api
    .post<Stock>(`/stock/${productId}/salida`, null, { params: { cantidad } })
    .then((r) => r.data);

    export const getAllMovements = () =>
  api.get<StockMovement[]>("/stock-movements").then((r) => r.data);

export const getMovementsByProduct = (productId: number) =>
  api
    .get<StockMovement[]>(`/stock-movements/product/${productId}`)
    .then((r) => r.data);

    