import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SalesClient } from '@/features/sales/components/sales-client';

export const metadata: Metadata = {
  title: 'Sales History',
};

export default function SalesPage() {
  return (
    <DashboardShell title="Sales History" description="View and manage past transactions.">
      <SalesClient />
    </DashboardShell>
  );
}
