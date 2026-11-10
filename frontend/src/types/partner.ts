export interface Partner {
  id: number;
  name: string;
  phone?: string;
  active: boolean;
}

export type BorrowingStatus = "PENDIENTE" | "PAGADO" | "DEVUELTO" | "CANCELADO";

export interface Borrowing {
  id: number;
  partnerId: number;
  partnerName: string;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
  status: BorrowingStatus;
  saleId?: number;
  registeredBy?: string;
  createdAt: string;
  closedBy?: string;
  closedAt?: string;
  note?: string;
}

export interface PartnerDebt {
  partnerId: number;
  partnerName: string;
  phone?: string;
  pendingCount: number;
  pendingAmount: number;
}