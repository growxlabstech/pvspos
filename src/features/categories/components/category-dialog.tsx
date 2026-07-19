'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CategoryForm } from './category-form';
import { CategoryWithCount } from '../types/category.types';
import { useCategoryMutations } from '../hooks/use-categories';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { toast } from 'sonner';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryWithCount | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const { createCategory, updateCategory } = useCategoryMutations();

  const isEditing = !!category;

  const handleSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, data });
        toast.success('Category updated successfully');
      } else {
        await createCategory.mutateAsync(data as CreateCategoryInput);
        toast.success('Category created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>
        <CategoryForm
          initialData={category}
          onSubmit={handleSubmit}
          isLoading={createCategory.isPending || updateCategory.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
