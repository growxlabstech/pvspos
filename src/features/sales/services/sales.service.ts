import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { SaleWithItems } from '../types/sales.types';

export const salesService = {
  async list(_userId: string, params: { page?: number; limit?: number; search?: string } = {}) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.search) {
      where.invoiceNumber = { contains: params.search };
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { saleItems: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    const items = sales.map((sale) => ({
      ...sale,
      items: sale.saleItems,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(id: string): Promise<SaleWithItems | null> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { saleItems: true },
    });
    if (!sale) return null;
    return {
      ...sale,
      items: sale.saleItems,
    } as any;
  },
};
