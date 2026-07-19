'use client';

import { useState } from 'react';
import { useProducts, useProductMutations } from '../hooks/use-products';
import { ProductTable } from './product-table';
import { ProductDialog } from './product-dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import { ProductWithInventory } from '../types/product.types';
import { AiProductScanner } from '@/components/ui/ai-product-scanner';
import { toast } from 'sonner';

export function ProductsClient() {
  const { data: products, isLoading, error } = useProducts();
  const { deleteProduct } = useProductMutations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithInventory | null>(null);

  const handleEdit = (product: ProductWithInventory) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success('Product deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleAiPreFill = (suggestion: any) => {
    setSelectedProduct({
      id: '',
      name: suggestion.name,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: '',
      description: `AI Detected: ${suggestion.name}`,
      categoryId: '',
      price: suggestion.price || 0,
      costPrice: 0,
      taxRate: 18,
      unit: suggestion.unit || 'PIECE',
      imageUrl: '',
      isActive: true,
      lowStockThreshold: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div className="text-danger">Failed to load products</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <Button
          onClick={() => setIsAiScannerOpen(true)}
          variant="outline"
          className="border-primary/30 text-primary hover:bg-primary/10"
        >
          🤖 AI Product Scanner
        </Button>
        <Button onClick={handleAddProduct}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <ProductTable
        products={products || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
      />

      <AiProductScanner
        open={isAiScannerOpen}
        onOpenChange={setIsAiScannerOpen}
        onPreFillForm={handleAiPreFill}
      />
    </div>
  );
}
