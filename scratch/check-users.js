const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying database profiles...');
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      roleId: true,
      appRole: {
        select: {
          code: true,
        }
      }
    }
  });

  console.log('Users in database:');
  console.log(JSON.stringify(profiles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
