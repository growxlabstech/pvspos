export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  createdAt: Date;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: "CASH" | "UPI";
  paymentStatus: "COMPLETED" | "PENDING" | "FAILED";
  notes: string | null;
  createdBy: string;
  createdAt: Date;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}
