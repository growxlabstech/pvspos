import { PrismaClient, Role, Unit, PaymentMethod, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PVS POS database...');

  // Create demo categories
  const beverageCategory = await prisma.category.upsert({
    where: { slug: 'beverages' },
    update: {},
    create: {
      name: 'Beverages',
      slug: 'beverages',
      description: 'Cold drinks, juices, packaged beverages',
    },
  });

  const snackCategory = await prisma.category.upsert({
    where: { slug: 'snacks' },
    update: {},
    create: {
      name: 'Snacks & Biscuits',
      slug: 'snacks',
      description: 'Chips, biscuits, confectioneries',
    },
  });

  const dairyCategory = await prisma.category.upsert({
    where: { slug: 'dairy' },
    update: {},
    create: {
      name: 'Dairy & Milk',
      slug: 'dairy',
      description: 'Fresh milk, butter, cheese, paneer',
    },
  });

  // Create demo products
  const products = [
    {
      name: 'Coca Cola 500ml',
      sku: 'BEV-COKE-500',
      barcode: '8901234567890',
      description: 'Sparkling soft drink bottle',
      categoryId: beverageCategory.id,
      price: 40,
      costPrice: 32,
      taxRate: 18,
      unit: Unit.PIECE,
      lowStockThreshold: 15,
      quantity: 50,
    },
    {
      name: 'Orange Juice 1L',
      sku: 'BEV-JUICE-1L',
      barcode: '8901234567891',
      description: '100% Real fruit juice pack',
      categoryId: beverageCategory.id,
      price: 110,
      costPrice: 85,
      taxRate: 12,
      unit: Unit.PACK,
      lowStockThreshold: 10,
      quantity: 25,
    },
    {
      name: 'Lays Masala Magic 50g',
      sku: 'SNK-LAYS-50G',
      barcode: '8901234567892',
      description: 'Potato chips Indian masala flavor',
      categoryId: snackCategory.id,
      price: 20,
      costPrice: 15,
      taxRate: 12,
      unit: Unit.PACK,
      lowStockThreshold: 20,
      quantity: 100,
    },
    {
      name: 'Oreo Chocolate Biscuits 120g',
      sku: 'SNK-OREO-120G',
      barcode: '8901234567893',
      description: 'Cream biscuit family pack',
      categoryId: snackCategory.id,
      price: 35,
      costPrice: 27,
      taxRate: 18,
      unit: Unit.PACK,
      lowStockThreshold: 15,
      quantity: 40,
    },
    {
      name: 'Amul Taaza Milk 1L',
      sku: 'DRY-MILK-1L',
      barcode: '8901234567894',
      description: 'Toned fresh milk pouch',
      categoryId: dairyCategory.id,
      price: 54,
      costPrice: 48,
      taxRate: 0,
      unit: Unit.LITER,
      lowStockThreshold: 10,
      quantity: 8, // Low stock demo!
    },
    {
      name: 'Amul Butter 100g',
      sku: 'DRY-BUTTER-100G',
      barcode: '8901234567895',
      description: 'Pasteurized salted butter',
      categoryId: dairyCategory.id,
      price: 58,
      costPrice: 50,
      taxRate: 12,
      unit: Unit.PACK,
      lowStockThreshold: 5,
      quantity: 18,
    },
  ];

  for (const prod of products) {
    const { quantity, ...productData } = prod;
    const existing = await prisma.product.findUnique({
      where: { sku: productData.sku },
    });

    if (!existing) {
      await prisma.product.create({
        data: {
          ...productData,
          inventory: {
            create: {
              quantity,
              reorderPoint: productData.lowStockThreshold,
              lastRestocked: new Date(),
            },
          },
        },
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
