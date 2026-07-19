const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying Login History...');
  const logs = await prisma.loginHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log(JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
