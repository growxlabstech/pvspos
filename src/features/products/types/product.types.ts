import { Category } from '@/features/categories/types/category.types';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  categoryId: string;
  price: number;
  costPrice: number;
  taxRate: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategory extends Product {
  category: Category;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
}

export interface ProductWithInventory extends ProductWithCategory {
  inventory: Inventory | null;
}
