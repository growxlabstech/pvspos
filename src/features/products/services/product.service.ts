import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { CreateProductInput, UpdateProductInput } from '../schemas/product.schema';

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
    const product = await prisma.product.create({
      data: {
        ...data,
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
