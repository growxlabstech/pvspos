'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema, CreateProductInput, UpdateProductInput } from '../schemas/product.schema';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ui/image-uploader';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { Product } from '../types/product.types';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => void;
  isLoading?: boolean;
}

export function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const { data: categories } = useCategories();
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: initialData?.name || '',
      sku: initialData?.sku || '',
      barcode: initialData?.barcode || '',
      categoryId: initialData?.categoryId || '',
      price: initialData?.price || 0,
      costPrice: initialData?.costPrice || 0,
      taxRate: initialData?.taxRate ?? 18,
      unit: (initialData?.unit as any) || 'PIECE',
      imageUrl: initialData?.imageUrl || '',
      lowStockThreshold: initialData?.lowStockThreshold ?? 10,
      description: initialData?.description || '',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Product Image Upload Section */}
      <div className="mb-2">
        <FormField label="Product Image" htmlFor="imageUrl" error={form.formState.errors.imageUrl?.message}>
          <Controller
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <ImageUploader
                value={field.value || ''}
                onChange={field.onChange}
                disabled={isLoading}
              />
            )}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name" htmlFor="name" error={form.formState.errors.name?.message}>
          <Input id="name" {...form.register('name')} placeholder="Product Name" disabled={isLoading} />
        </FormField>

        <FormField label="Category" htmlFor="categoryId" error={form.formState.errors.categoryId?.message}>
          <select
            id="categoryId"
            {...form.register('categoryId')}
            disabled={isLoading}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>Select Category</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="SKU (Auto-generated)" htmlFor="sku" error={form.formState.errors.sku?.message}>
          <Input
            id="sku"
            {...form.register('sku')}
            placeholder="Leave blank to auto-generate"
            disabled={isLoading}
            className="font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {initialData?.sku ? `Current: ${initialData.sku}` : 'SKU will be auto-generated if left empty (e.g. PVS-DAIR-00001)'}
          </p>
        </FormField>

        <FormField label="Barcode" htmlFor="barcode" error={form.formState.errors.barcode?.message}>
          <Input id="barcode" {...form.register('barcode')} placeholder="Scan or enter barcode" disabled={isLoading} className="font-mono" />
        </FormField>

        <FormField label="Price" htmlFor="price" error={form.formState.errors.price?.message}>
          <Input id="price" type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} placeholder="0.00" disabled={isLoading} />
        </FormField>

        <FormField label="Cost Price" htmlFor="costPrice" error={form.formState.errors.costPrice?.message}>
          <Input id="costPrice" type="number" step="0.01" {...form.register('costPrice', { valueAsNumber: true })} placeholder="0.00" disabled={isLoading} />
        </FormField>

        <FormField label="Tax Rate (%)" htmlFor="taxRate" error={form.formState.errors.taxRate?.message}>
          <Input id="taxRate" type="number" step="0.1" {...form.register('taxRate', { valueAsNumber: true })} disabled={isLoading} />
        </FormField>

        <FormField label="Unit" htmlFor="unit" error={form.formState.errors.unit?.message}>
          <select
            id="unit"
            {...form.register('unit')}
            disabled={isLoading}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {['PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'DOZEN', 'BOX', 'PACK'].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Low Stock Threshold" htmlFor="lowStockThreshold" error={form.formState.errors.lowStockThreshold?.message}>
          <Input id="lowStockThreshold" type="number" {...form.register('lowStockThreshold', { valueAsNumber: true })} disabled={isLoading} />
        </FormField>
      </div>

      <FormField label="Description" htmlFor="description" error={form.formState.errors.description?.message}>
        <Textarea id="description" {...form.register('description')} disabled={isLoading} />
      </FormField>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
