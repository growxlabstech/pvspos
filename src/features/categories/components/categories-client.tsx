'use client';

import { useState } from 'react';
import { useCategories, useCategoryMutations } from '../hooks/use-categories';
import { CategoryTable } from './category-table';
import { CategoryDialog } from './category-dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import { CategoryWithCount } from '../types/category.types';
import { toast } from 'sonner';

export function CategoriesClient() {
  const { data: categories, isLoading, error } = useCategories();
  const { deleteCategory } = useCategoryMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithCount | null>(null);

  const handleEdit = (category: CategoryWithCount) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success('Category deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  if (error) {
    return <div className="text-danger">Failed to load categories</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAddCategory}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <CategoryTable
        categories={categories || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={selectedCategory}
      />
    </div>
  );
}
