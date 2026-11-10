import type { FractionCode } from "./product";

export type PaymentMethod = "EFECTIVO" | "YAPE" | "PLIN" | "TARJETA" | "TRANSFERENCIA";

export interface SaleItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountReason: string | null;
  fraction: FractionCode | null;
  partnerId: number | null;
  externalCost: number | null;
}

export interface SaleInput {
  customerName: string | null;
  paymentMethod: PaymentMethod;
  note: string | null;
  items: SaleItemInput[];
}

export interface SaleItem {
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  fractionLabel?: string;
  containerId?: number;
  externalFrom?: string;
  listPrice: number;
  minPrice: number;
  unitPrice: number;
  discountPerUnit: number;
  discountPercent: number;
  discountReason?: string;
  subtotal: number;
  cost?: number;
  profit?: number;
}

export interface Sale {
  id: number;
  customerName?: string;
  paymentMethod: PaymentMethod;
  note?: string;
  total: number;
  status: "COMPLETADA" | "ANULADA";
  soldBy: string;
  createdAt: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancelReason?: string;
  totalDiscount: number;
  totalProfit?: number;
  items: SaleItem[];
}