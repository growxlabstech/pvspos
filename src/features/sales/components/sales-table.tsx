'use client';

import { useState } from 'react';
import { useSales } from '../hooks/use-sales';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SaleWithItems } from '../types/sales.types';
import { SaleDetailDialog } from './sale-detail-dialog';
import { EyeIcon } from '@/components/icons';

export function SalesTable() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSales(search);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);

  if (isLoading) return <div>Loading sales history...</div>;

  const sales = data?.items || [];

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by invoice number..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded-md w-full max-w-sm"
      />
      <div className="border rounded-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Invoice Number</th>
              <th className="p-3">Date</th>
              <th className="p-3">Items Count</th>
              <th className="p-3">Subtotal</th>
              <th className="p-3">Tax</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment Method</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale: SaleWithItems) => (
              <tr key={sale.id} className="border-t">
                <td className="p-3 font-medium">{sale.invoiceNumber}</td>
                <td className="p-3">{formatDateTime(sale.createdAt)}</td>
                <td className="p-3">{sale.items.length} items</td>
                <td className="p-3">{formatCurrency(sale.subtotal)}</td>
                <td className="p-3">{formatCurrency(sale.taxAmount)}</td>
                <td className="p-3 font-bold">{formatCurrency(sale.total)}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-muted rounded-full text-xs">
                    {sale.paymentMethod}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setSelectedSale(sale)}
                    className="p-2 hover:bg-muted rounded-md text-primary cursor-pointer"
                    title="View Details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
                  No sales found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <SaleDetailDialog
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
}
