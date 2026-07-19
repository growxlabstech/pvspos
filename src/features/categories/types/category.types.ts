export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithCount extends Category {
  _count: {
    products: number;
  };
}
