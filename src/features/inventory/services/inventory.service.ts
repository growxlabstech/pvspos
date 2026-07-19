import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { InventoryItem } from '../types/inventory.types';

function formatInventoryItem(item: any): InventoryItem {
  return {
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
      costPrice: Number(item.product.costPrice),
      taxRate: Number(item.product.taxRate),
    },
  };
}

export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const items = await prisma.inventory.findMany({
      include: { product: true },
      orderBy: { quantity: 'asc' },
    });
    return items.map(formatInventoryItem);
  },

  async getLowStock(): Promise<InventoryItem[]> {
    const items = await prisma.inventory.findMany({
      include: { product: true },
    });
    const formatted = items.map(formatInventoryItem);
    return formatted.filter((item) => item.quantity <= item.reorderPoint);
  },

  async restock(productId: string, quantity: number): Promise<InventoryItem> {
    const item = await prisma.inventory.update({
      where: { productId },
      data: {
        quantity: { increment: quantity },
        lastRestocked: new Date(),
      },
      include: { product: true },
    });
    return formatInventoryItem(item);
  },

  async adjustStock(productId: string, quantity: number, _reason: string): Promise<InventoryItem> {
    const current = await prisma.inventory.findUniqueOrThrow({
      where: { productId },
    });

    if (current.quantity + quantity < 0) {
      throw new Error('Cannot adjust stock below 0');
    }

    const item = await prisma.inventory.update({
      where: { productId },
      data: { quantity: { increment: quantity } },
      include: { product: true },
    });
    return formatInventoryItem(item);
  },
};
