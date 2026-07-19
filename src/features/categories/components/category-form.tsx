'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Category } from '../types/category.types';

interface CategoryFormProps {
  initialData?: Category | null;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => void;
  isLoading?: boolean;
}

export function CategoryForm({ initialData, onSubmit, isLoading }: CategoryFormProps) {
  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      imageUrl: initialData?.imageUrl || '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Name" htmlFor="cat-name" error={form.formState.errors.name?.message}>
        <Input id="cat-name" {...form.register('name')} placeholder="Category Name" disabled={isLoading} />
      </FormField>

      <FormField label="Description" htmlFor="cat-desc" error={form.formState.errors.description?.message}>
        <Textarea id="cat-desc" {...form.register('description')} placeholder="Category Description" disabled={isLoading} />
      </FormField>

      <FormField label="Image URL" htmlFor="cat-img" error={form.formState.errors.imageUrl?.message}>
        <Input id="cat-img" {...form.register('imageUrl')} placeholder="https://example.com/image.jpg" disabled={isLoading} />
      </FormField>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
