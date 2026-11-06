export interface FractionPrice {
  fraction: FractionCode;
  label: string;
  value: number;
  listPrice: number;
  minPrice: number; // piso efectivo
}

export type FractionCode =
  | "TREINTAIDOSAVO"
  | "DIECISEISAVO"
  | "OCTAVO"
  | "CUARTO"
  | "MEDIO";

export const FRACTIONS: { code: FractionCode; label: string }[] = [
  { code: "MEDIO", label: "1/2" },
  { code: "CUARTO", label: "1/4" },
  { code: "OCTAVO", label: "1/8" },
  { code: "DIECISEISAVO", label: "1/16" },
  { code: "TREINTAIDOSAVO", label: "1/32" },
];

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string | null;
  barcode: string | null;
  price: number;
  minPrice?: number;
  active: boolean;
  createdAt: string;
  fractionable?: boolean;
  fractions?: FractionPrice[];
  // Solo llegan si el usuario es ADMIN
  cost?: number;
  profitPerUnit?: number;
  marginPercent?: number;
}

export interface FractionInput {
  fraction: FractionCode;
  listPrice: number;
  minPrice: number | null;
}

export type ProductInput = {
  code: string;
  name: string;
  description: string | null;
  barcode: string | null;
  cost: number | null;
  price: number;
  minPrice: number | null;
  active: boolean;
  fractionable: boolean;
  fractions: FractionInput[];
};

export type ProductRow = Product & { stock: number; minimumStock: number };