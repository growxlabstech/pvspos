import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { InventoryClient } from '@/features/inventory/components/inventory-client';

export const metadata: Metadata = {
  title: 'Inventory',
};

export default function InventoryPage() {
  return (
    <DashboardShell title="Inventory" description="Manage your product stock levels.">
      <InventoryClient />
    </DashboardShell>
  );
}
