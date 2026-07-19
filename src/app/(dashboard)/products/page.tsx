import { DashboardShell } from '@/components/layout/dashboard-shell';
import { ProductsClient } from '@/features/products/components/products-client';

export default function ProductsPage() {
  return (
    <DashboardShell title="Products">
      <ProductsClient />
    </DashboardShell>
  );
}
