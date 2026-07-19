import 'server-only';
import { prisma } from '@/lib/prisma/client';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';
import { slugify } from '@/lib/utils';

export const categoryService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  },

  async create(data: CreateCategoryInput) {
    const slug = slugify(data.name);
    return prisma.category.create({
      data: {
        ...data,
        slug,
      },
    });
  },

  async update(id: string, data: UpdateCategoryInput) {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = slugify(data.name);
    }
    return prisma.category.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (category && category._count.products > 0) {
      throw new Error('Cannot delete category with linked products');
    }

    return prisma.category.delete({
      where: { id },
    });
  },
};
