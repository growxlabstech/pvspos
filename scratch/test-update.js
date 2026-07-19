const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing product update...');
  const firstProduct = await prisma.product.findFirst();
  
  if (!firstProduct) {
    console.log('No products found to test update.');
    return;
  }

  console.log('Found product:', firstProduct.id, firstProduct.name);

  try {
    const updatedService = await prisma.product.update({
      where: { id: firstProduct.id },
      data: {
        name: firstProduct.name,
        sku: firstProduct.sku,
        barcode: firstProduct.barcode || '',
        categoryId: firstProduct.categoryId,
        price: Number(firstProduct.price),
        costPrice: Number(firstProduct.costPrice),
        taxRate: Number(firstProduct.taxRate),
        unit: firstProduct.unit,
        imageUrl: firstProduct.imageUrl || '',
        lowStockThreshold: firstProduct.lowStockThreshold,
        description: firstProduct.description || '',
      }
    });
    console.log('Service update simulated success:', updatedService.name);
  } catch (err) {
    console.error('Service update simulated failed:', err);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
