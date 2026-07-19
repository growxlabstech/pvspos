import { DashboardShell } from '@/components/layout/dashboard-shell';
import { DashboardStats } from '@/features/dashboard/components/dashboard-stats';
import { RecentSales } from '@/features/dashboard/components/recent-sales';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { getSessionUser } from '@/lib/auth/session';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';

export default async function DashboardPage() {
  const user = await getSessionUser();

  // Default stats for when there's no user or no data yet
  const defaultStats = {
    todayRevenue: 0,
    todaySalesCount: 0,
    totalProducts: 0,
    lowStockItems: 0,
    revenueTrend: 0,
    salesTrend: 0,
  };

  let stats = defaultStats;
  let recentSales: Awaited<ReturnType<typeof dashboardService.getRecentSales>> = [];

  if (user) {
    try {
      [stats, recentSales] = await Promise.all([
        dashboardService.getStats(user.userId),
        dashboardService.getRecentSales(user.userId),
      ]);
    } catch {
      // Use defaults if DB is not set up yet
    }
  }


  const serializedSales = recentSales.map((sale) => ({
    ...sale,
    total: Number(sale.total),
    subtotal: Number(sale.subtotal),
    taxAmount: Number(sale.taxAmount),
    discountAmount: Number(sale.discountAmount),
    createdAt: sale.createdAt.toISOString(),
  }));

  return (
    <DashboardShell
      title="Dashboard"
      description="Overview of your store performance"
    >
      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSales sales={serializedSales} />
        <QuickActions />
      </div>
    </DashboardShell>
  );
}
