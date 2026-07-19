import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

export const dashboardService = {
  async getStats(userId: string) {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    const startOfYesterday = startOfDay(subDays(today, 1));
    const endOfYesterday = endOfDay(subDays(today, 1));

    const [
      todaySales,
      yesterdaySales,
      totalProducts,
      lowStockItems,
    ] = await Promise.all([
      // Today's sales
      prisma.sale.aggregate({
        where: {
          createdBy: userId,
          createdAt: { gte: startOfToday, lte: endOfToday },
          paymentStatus: 'COMPLETED',
        },
        _sum: { total: true },
        _count: true,
      }),
      // Yesterday's sales
      prisma.sale.aggregate({
        where: {
          createdBy: userId,
          createdAt: { gte: startOfYesterday, lte: endOfYesterday },
          paymentStatus: 'COMPLETED',
        },
        _sum: { total: true },
        _count: true,
      }),
      // Total active products
      prisma.product.count({
        where: { isActive: true },
      }),
      // Low stock items
      prisma.inventory.count({
        where: {
          quantity: { lte: prisma.inventory.fields.reorderPoint },
        },
      }),
    ]);

    const todayRevenue = Number(todaySales._sum.total ?? 0);
    const yesterdayRevenue = Number(yesterdaySales._sum.total ?? 0);
    const revenueTrend = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

    const todayCount = todaySales._count;
    const yesterdayCount = yesterdaySales._count;
    const salesTrend = yesterdayCount > 0
      ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
      : 0;

    return {
      todayRevenue,
      todaySalesCount: todayCount,
      totalProducts,
      lowStockItems,
      revenueTrend: Math.round(revenueTrend * 10) / 10,
      salesTrend: Math.round(salesTrend * 10) / 10,
    };
  },

  async getRecentSales(userId: string, limit = 5) {
    return prisma.sale.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: { select: { saleItems: true } },
      },
    });
  },
};
