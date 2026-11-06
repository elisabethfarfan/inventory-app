import type { Product } from "./product";

export type MovementType = "IN" | "OUT";

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