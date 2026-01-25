import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export async function seedAdmin() {
  console.log("🌱 Seeding admin users, roles, and permissions...");

  // Create permissions
  const permissions = [
    { code: "USER_MANAGEMENT", description: "Manage user accounts" },
    { code: "PRODUCT_MANAGEMENT", description: "Manage products and variants" },
    { code: "CATEGORY_MANAGEMENT", description: "Manage categories" },
    { code: "ORDER_MANAGEMENT", description: "Manage orders" },
    { code: "REVIEW_MANAGEMENT", description: "Manage product reviews" },
    { code: "ADMIN_MANAGEMENT", description: "Manage admin users and roles" },
    { code: "ANALYTICS_VIEW", description: "View analytics and reports" },
    { code: "SETTINGS_MANAGEMENT", description: "Manage system settings" },
  ];

  const createdPermissions = [];
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
    createdPermissions.push(permission);
    console.log(`  ✓ Permission created: ${permission.code}`);
  }

  // Create Super Admin role with all permissions
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SuperAdmin" },
    update: {},
    create: {
      name: "SuperAdmin",
      description: "Full system access with all permissions",
    },
  });
  console.log(`  ✓ Role created: ${superAdminRole.name}`);

  // Assign all permissions to SuperAdmin role
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`  ✓ Assigned all permissions to SuperAdmin role`);

  // Create Manager role with limited permissions
  const managerRole = await prisma.role.upsert({
    where: { name: "Manager" },
    update: {},
    create: {
      name: "Manager",
      description: "Manage products, categories, and orders",
    },
  });
  console.log(`  ✓ Role created: ${managerRole.name}`);

  // Assign specific permissions to Manager role
  const managerPermissions = createdPermissions.filter((p) =>
    ["PRODUCT_MANAGEMENT", "CATEGORY_MANAGEMENT", "ORDER_MANAGEMENT", "ANALYTICS_VIEW"].includes(
      p.code
    )
  );
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log(`  ✓ Assigned permissions to Manager role`);

  // Create default Super Admin user
  const hashedPassword = await bcrypt.hash("Admin@123", 10);
  const adminUser = await prisma.adminUser.upsert({
    where: { email: "admin@ecommercely.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@ecommercely.com",
      password: hashedPassword,
      isActive: true,
      roleId: superAdminRole.id,
    },
  });
  console.log(`  ✓ Admin user created: ${adminUser.email}`);
  console.log(`    Password: Admin@123`);

  console.log("✅ Admin seeding completed!\n");
}
