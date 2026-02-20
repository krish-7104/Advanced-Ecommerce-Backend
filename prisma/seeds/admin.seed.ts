import { PrismaClient } from "../../generated/prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";
import { seedPermissions } from "./permission.seed";

export async function seedAdmin(prisma: PrismaClient) {
  console.log("Seeding admin data...");

  const permissions = await seedPermissions(prisma);

  const email = process.env.NEXT_SUPER_ADMIN_EMAIL;
  if (!email) {
    console.warn(
      "NEXT_SUPER_ADMIN_EMAIL not set, skipping super admin creation",
    );
    return;
  }

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });

  if (!existingAdmin) {
    console.log(`Creating super admin: ${email}`);
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await prisma.adminUser.create({
      data: {
        name: "Super Admin",
        email,
        password: hashedPassword,
        isActive: true,
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
    });
  } else {
    console.log(`Super admin exists, ensuring all permissions...`);
    // Update existing super admin to have all permissions
    await prisma.adminUser.update({
      where: { email },
      data: {
        permissions: {
          set: permissions.map((p) => ({ id: p.id })), // Use set to ensure they have ALL
        },
      },
    });
  }

  console.log("Admin seeding completed.");
}
