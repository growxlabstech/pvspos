import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

/**
 * Auto-generate a unique SKU code.
 * Format: PVS-{CATEGORY_PREFIX}-{5_DIGIT_SEQUENCE}
 * Example: PVS-DAIRY-00042, PVS-BVRG-00001
 */
async function generateSku(categoryId?: string): Promise<string> {
  let prefix = 'GEN';

  if (categoryId) {
    try {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { name: true },
      });
      if (category?.name) {
        // Take first 4 chars of category name, uppercase, remove special chars
        prefix = category.name
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 4)
          .toUpperCase();
      }
    } catch {
      // fallback to GEN
    }
  }

  // Get current product count for sequential numbering
  const count = await prisma.product.count();
  const seq = String(count + 1).padStart(5, '0');

  const sku = `PVS-${prefix}-${seq}`;

  // Ensure uniqueness — if somehow this SKU exists, add random suffix
  const exists = await prisma.product.findUnique({ where: { sku } });
  if (exists) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PVS-${prefix}-${seq}-${rand}`;
  }

  return sku;
}

export const productService = {
  async list(params?: { search?: string }) {
    const where = params?.search
      ? {
          name: { contains: params.search, mode: 'insensitive' as const },
        }
      : {};

    const products = await prisma.product.findMany({
      where: { ...where, isActive: true },
      include: {
        category: true,
        inventory: true,
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p: any) => ({
      ...p,
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      taxRate: Number(p.taxRate),
    }));
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, inventory: true },
    });
    if (!product) return null;
    return {
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      taxRate: Number(product.taxRate),
    };
  },

  async getByBarcode(barcode: string) {
    const product = await prisma.product.findFirst({
      where: { barcode, isActive: true },
      include: { category: true, inventory: true },
    });
    if (!product) return null;
    return {
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      taxRate: Number(product.taxRate),
    };
  },

  async create(data: CreateProductInput) {
    // Auto-generate SKU if not provided
    const sku = data.sku && data.sku.trim() !== '' ? data.sku : await generateSku(data.categoryId);

    const product = await prisma.product.create({
      data: {
        ...data,
        sku,
        inventory: {
          create: { quantity: 0 },
        },
      },
      include: { category: true, inventory: true },
    });
    return {
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      taxRate: Number(product.taxRate),
    };
  },


  async update(id: string, data: UpdateProductInput) {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, inventory: true },
    });
    return {
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      taxRate: Number(product.taxRate),
    };
  },

  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async search(query: string) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { category: true, inventory: true },
      take: 20,
    });
    return products.map((p: any) => ({
      ...p,
      price: Number(p.price),
      costPrice: Number(p.costPrice),
      taxRate: Number(p.taxRate),
    }));
  },
};
