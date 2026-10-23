export interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  active: boolean;
  createdAt: string;
}

export type ProductInput = Omit<Product, "id" | "createdAt">;

// Producto + su stock, para la tabla
export type ProductRow = Product & { stock: number; minimumStock: number };