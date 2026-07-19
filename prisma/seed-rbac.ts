import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Dynamic RBAC system data...');

  // 1. Create Default Branches
  const mainBranch = await prisma.branch.upsert({
    where: { code: 'MAIN' },
    update: {},
    create: {
      name: 'Main Retail PVS Branch',
      code: 'MAIN',
      address: '123 Retail Hub, Mumbai',
      phone: '9876543210',
    },
  });

  const westBranch = await prisma.branch.upsert({
    where: { code: 'WEST' },
    update: {},
    create: {
      name: 'West Division Branch',
      code: 'WEST',
      address: '456 Business Galleria, Pune',
      phone: '9812345678',
    },
  });

  // 2. Create Dynamic Permissions
  const permissionsData = [
    // Products
    { module: 'Products', action: 'View', code: 'PRODUCTS_VIEW', description: 'Can view products' },
    { module: 'Products', action: 'Create', code: 'PRODUCTS_CREATE', description: 'Can create new products' },
    { module: 'Products', action: 'Update', code: 'PRODUCTS_UPDATE', description: 'Can edit existing products' },
    { module: 'Products', action: 'Delete', code: 'PRODUCTS_DELETE', description: 'Can delete products' },
    // Billing
    { module: 'Billing', action: 'Create Bill', code: 'BILLING_CREATE', description: 'Can checkout and make bills' },
    { module: 'Billing', action: 'Cancel Bill', code: 'BILLING_CANCEL', description: 'Can cancel completed bills' },
    { module: 'Billing', action: 'Apply Discount', code: 'BILLING_DISCOUNT', description: 'Can apply bill discounts' },
    { module: 'Billing', action: 'Price Override', code: 'BILLING_PRICE_OVERRIDE', description: 'Can override item unit prices' },
    // Inventory
    { module: 'Inventory', action: 'View', code: 'INVENTORY_VIEW', description: 'Can view inventory stock list' },
    { module: 'Inventory', action: 'Stock In', code: 'INVENTORY_STOCK_IN', description: 'Can restock inventory items' },
    { module: 'Inventory', action: 'Stock Out', code: 'INVENTORY_STOCK_OUT', description: 'Can manually deduct stock' },
    { module: 'Inventory', action: 'Adjust Stock', code: 'INVENTORY_ADJUST', description: 'Can override reorder points' },
    // Reports
    { module: 'Reports', action: 'View', code: 'REPORTS_VIEW', description: 'Can view dashboard and sales reports' },
    { module: 'Reports', action: 'Export', code: 'REPORTS_EXPORT', description: 'Can download/export reports' },
    // Settings
    { module: 'Settings', action: 'View', code: 'SETTINGS_VIEW', description: 'Can view system/store settings' },
    { module: 'Settings', action: 'Update', code: 'SETTINGS_UPDATE', description: 'Can modify store information' },
    // Users
    { module: 'Users', action: 'Manage', code: 'USERS_MANAGE', description: 'Can manage users, roles, and permissions' },
  ];

  const dbPermissions: Record<string, string> = {};
  for (const perm of permissionsData) {
    const created = await prisma.appPermission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    dbPermissions[perm.code] = created.id;
  }

  // 3. Create Dynamic Roles
  const rolesData = [
    { name: 'Super Admin', code: 'SUPER_ADMIN', description: 'Complete administrative access to all branches' },
    { name: 'Store Owner', code: 'STORE_OWNER', description: 'Full access to single store reports and settings' },
    { name: 'Manager', code: 'MANAGER', description: 'Manage inventory, catalog, and oversee cashier staff' },
    { name: 'Cashier', code: 'CASHIER', description: 'Standard checkout and billing duties' },
    { name: 'Inventory Staff', code: 'INVENTORY_STAFF', description: 'Stock restocking and audit management' },
  ];

  const dbRoles: Record<string, string> = {};
  for (const r of rolesData) {
    const created = await prisma.appRole.upsert({
      where: { code: r.code },
      update: {},
      create: {
        ...r,
        isSystem: r.code === 'SUPER_ADMIN' || r.code === 'STORE_OWNER',
      },
    });
    dbRoles[r.code] = created.id;
  }

  // Helper to map permissions to roles
  const assignPermissions = async (roleCode: string, codes: string[]) => {
    const roleId = dbRoles[roleCode];
    for (const code of codes) {
      const permissionId = dbPermissions[code];
      if (roleId && permissionId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId },
          },
          update: {},
          create: { roleId, permissionId },
        });
      }
    }
  };

  // Assign Super Admin all permissions
  await assignPermissions('SUPER_ADMIN', Object.keys(dbPermissions));

  // Assign Store Owner all permissions
  await assignPermissions('STORE_OWNER', Object.keys(dbPermissions));

  // Assign Manager permissions
  await assignPermissions('MANAGER', [
    'PRODUCTS_VIEW', 'PRODUCTS_CREATE', 'PRODUCTS_UPDATE',
    'BILLING_CREATE', 'BILLING_DISCOUNT',
    'INVENTORY_VIEW', 'INVENTORY_STOCK_IN', 'INVENTORY_STOCK_OUT',
    'REPORTS_VIEW', 'SETTINGS_VIEW'
  ]);

  // Assign Cashier permissions
  await assignPermissions('CASHIER', [
    'PRODUCTS_VIEW', 'BILLING_CREATE', 'INVENTORY_VIEW'
  ]);

  // Assign Inventory Staff permissions
  await assignPermissions('INVENTORY_STAFF', [
    'PRODUCTS_VIEW', 'INVENTORY_VIEW', 'INVENTORY_STOCK_IN', 'INVENTORY_STOCK_OUT'
  ]);

  // 4. Map existing administrator to dynamic Super Admin role & Main Branch
  const adminEmail = 'growxlabstech@gmail.com';
  const adminProfile = await prisma.profile.findUnique({
    where: { email: adminEmail },
  });

  if (adminProfile) {
    await prisma.profile.update({
      where: { id: adminProfile.id },
      data: {
        roleId: dbRoles['SUPER_ADMIN'],
        branchId: mainBranch.id,
      },
    });
    console.log(`Successfully mapped administrator profile to dynamic SUPER_ADMIN and branch MAIN`);
  }

  console.log('Dynamic RBAC data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('RBAC Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
