'use client';

import { useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryWithCount } from '../types/category.types';
import { EditIcon, TrashIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface CategoryTableProps {
  categories: CategoryWithCount[];
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (id: string) => void;
}

export function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Name',
      accessor: (row: CategoryWithCount) => row.name,
    },
    {
      header: 'Products',
      accessor: (row: CategoryWithCount) => row._count.products,
    },
    {
      header: 'Status',
      accessor: (row: CategoryWithCount) => (
        <span className={`px-2 py-1 rounded-full text-xs ${row.isActive ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: (row: CategoryWithCount) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row: CategoryWithCount) => (
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
          placeholder="Search categories..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <DataTable columns={columns} data={filteredCategories} />
      
      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
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
