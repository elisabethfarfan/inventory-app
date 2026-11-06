export interface OpenContainer {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  remaining: number; // en baldes: 0.75 = tres cuartos
  openedBy: string;
  openedAt: string;
}

export interface ContainerSummary {
  productId: number;
  productCode: string;
  productName: string;
  closedStock: number;
  openCount: number;
  openRemaining: number;
}