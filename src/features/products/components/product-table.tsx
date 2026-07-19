'use client';

import { useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductWithInventory } from '../types/product.types';
import { EditIcon, TrashIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ProductTableProps {
  products: ProductWithInventory[];
  onEdit: (product: ProductWithInventory) => void;
  onDelete: (id: string) => void;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Name',
      accessor: (row: ProductWithInventory) => row.name,
    },
    {
      header: 'SKU',
      accessor: (row: ProductWithInventory) => row.sku,
    },
    {
      header: 'Category',
      accessor: (row: ProductWithInventory) => row.category?.name,
    },
    {
      header: 'Price',
      accessor: (row: ProductWithInventory) => `₹${Number(row.price).toFixed(2)}`,
    },
    {
      header: 'Stock',
      accessor: (row: ProductWithInventory) => {
        const qty = row.inventory?.quantity || 0;
        const isLow = qty <= row.lowStockThreshold;
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${isLow ? 'bg-warning-light text-warning' : 'bg-success-light text-success'}`}>
            {qty} {row.unit}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: ProductWithInventory) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.isActive ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: ProductWithInventory) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeletingId(row.id)}>
            <TrashIcon className="h-4 w-4 text-danger" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input 
          placeholder="Search products by name or SKU..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <DataTable columns={columns} data={filteredProducts} />
      
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={() => {
          if (deletingId) {
            onDelete(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </div>
  );
}
