'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryWithCount } from '../types/category.types';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

async function fetchCategories(): Promise<CategoryWithCount[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete category');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  return { createCategory, updateCategory, deleteCategory };
}
