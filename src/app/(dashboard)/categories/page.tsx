import { DashboardShell } from '@/components/layout/dashboard-shell';
import { CategoriesClient } from '@/features/categories/components/categories-client';

export default function CategoriesPage() {
  return (
    <DashboardShell title="Categories">
      <CategoriesClient />
    </DashboardShell>
  );
}
