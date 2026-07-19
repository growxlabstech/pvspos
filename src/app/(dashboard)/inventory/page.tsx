import { Metadata } from 'next';
import { InventoryClient } from '@/features/inventory/components/inventory-client';

export const metadata: Metadata = {
  title: 'Inventory',
};

export default function InventoryPage() {
  return (
    <div className="p-8">
      <InventoryClient />
    </div>
  );
}
