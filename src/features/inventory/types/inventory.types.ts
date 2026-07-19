export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  unit: string;
  lowStockThreshold: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  reorderPoint: number;
  lastRestocked: Date | null;
  updatedAt: Date;
  product: Product;
}
