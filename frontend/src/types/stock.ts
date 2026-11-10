import type { Product } from "./product";

export type MovementType = "IN" | "OUT";

export interface Stock {
  id: number;
  product: Product;
  quantity: number;
  minimumStock: number;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  product: Product;
  type: "ENTRADA" | "SALIDA";
  quantity: number;
  previousStock: number;
  newStock: number;
  registeredBy: string | null;
  createdAt: string;
}