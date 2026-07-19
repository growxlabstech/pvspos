'use client';

import { StatCard } from '@/components/shared/stat-card';
import { IndianRupeeIcon, ShoppingCartIcon, PackageIcon, AlertTriangleIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/utils';

interface DashboardStatsProps {
  stats: {
    todayRevenue: number;
    todaySalesCount: number;
    totalProducts: number;
    lowStockItems: number;
    revenueTrend: number;
    salesTrend: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Today's Revenue"
        value={formatCurrency(stats.todayRevenue)}
        icon={IndianRupeeIcon}
        trend={{ value: stats.revenueTrend, isPositive: stats.revenueTrend >= 0 }}
        iconColor="text-primary"
        iconBgColor="bg-primary-light"
        index={0}
      />
      <StatCard
        title="Today's Sales"
        value={String(stats.todaySalesCount)}
        icon={ShoppingCartIcon}
        trend={{ value: stats.salesTrend, isPositive: stats.salesTrend >= 0 }}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-50"
        index={1}
      />
      <StatCard
        title="Total Products"
        value={String(stats.totalProducts)}
        icon={PackageIcon}
        iconColor="text-emerald-600"
        iconBgColor="bg-emerald-50"
        index={2}
      />
      <StatCard
        title="Low Stock Items"
        value={String(stats.lowStockItems)}
        icon={AlertTriangleIcon}
        iconColor={stats.lowStockItems > 0 ? 'text-warning' : 'text-muted-foreground'}
        iconBgColor={stats.lowStockItems > 0 ? 'bg-warning-light' : 'bg-muted'}
        index={3}
      />
    </div>
  );
}
