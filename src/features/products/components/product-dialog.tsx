'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductForm } from './product-form';
import { ProductWithInventory } from '../types/product.types';
import { useProductMutations } from '../hooks/use-products';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';
import { toast } from 'sonner';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithInventory | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { createProduct, updateProduct } = useProductMutations();

  const isEditing = !!product;

  const handleSubmit = async (data: CreateProductInput | UpdateProductInput) => {
    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, data });
        toast.success('Product updated successfully');
      } else {
        await createProduct.mutateAsync(data as CreateProductInput);
        toast.success('Product created successfully');
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <ProductForm
          initialData={product}
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
