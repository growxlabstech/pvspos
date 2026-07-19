import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { CheckoutPayload } from '../types/billing.types';

export const billingService = {
  async checkout(userId: string, data: CheckoutPayload) {
    return prisma.$transaction(async (tx) => {
      // 1. Generate invoice number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await tx.sale.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      });
      const invoiceNumber = `INV-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      // 2. Calculate totals
      let subtotal = 0;
      let taxAmount = 0;

      const saleItemsData = [];

      for (const item of data.items) {
        // Fetch product and validate stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { inventory: true },
        });

        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (!product.inventory || product.inventory.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const itemTotal = item.unitPrice * item.quantity;
        const itemTax = (itemTotal * item.taxRate) / 100;

        subtotal += itemTotal;
        taxAmount += itemTax;

        saleItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: itemTax,
          discount: 0,
          total: itemTotal + itemTax,
        });

        // Decrement inventory
        await tx.inventory.update({
          where: { productId: product.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      const total = subtotal + taxAmount - data.discount;

      // 3. Create Sale record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          subtotal,
          taxAmount,
          discountAmount: data.discount,
          total,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'COMPLETED',
          notes: data.notes,
          createdBy: userId,
          saleItems: {
            create: saleItemsData,
          },
        },
        include: { saleItems: true },
      });

      return sale;
    });
  },
};
