const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  'Groceries',
  'Fruits & Vegetables',
  'Rice & Grains',
  'Dal & Pulses',
  'Spices & Masala',
  'Cooking Oil & Ghee',
  'Frozen Foods',
  'Bakery & Bread',
  'Meat & Seafood',
  'Personal Care',
  'Cleaning & Household',
  'Baby Care',
  'Health & Wellness',
  'Alcohol & Spirits',
  'Noodles & Pasta',
  'Sauces & Condiments',
  'Dry Fruits & Nuts',
  'Pooja & Religious',
  'Stationery',
  'Pet Care',
];

async function main() {
  console.log('Seeding missing categories...\n');

  for (const name of CATEGORIES) {
    const exists = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (exists) {
      console.log(`  ✓ Already exists: ${name}`);
    } else {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await prisma.category.create({ data: { name, slug } });
      console.log(`  + Created: ${name}`);
    }
  }

  console.log('\nDone! All categories seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
