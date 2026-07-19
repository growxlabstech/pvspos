'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductWithInventory } from '../types/product.types';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

export function useProducts(search?: string) {
  return useQuery({
    queryKey: ['products', search],
    queryFn: async (): Promise<ProductWithInventory[]> => {
      const url = search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async (): Promise<ProductWithInventory> => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useProductByBarcode(barcode: string) {
  return useQuery({
    queryKey: ['product', 'barcode', barcode],
    queryFn: async (): Promise<ProductWithInventory | null> => {
      if (!barcode) return null;
      const res = await fetch(`/api/products/barcode/${barcode}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch product by barcode');
      return res.json();
    },
    enabled: !!barcode,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductInput }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update product');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete product');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  return { createProduct, updateProduct, deleteProduct };
}
