import { PrismaClient } from "../../generated/prisma/client";
import { FLAT_PERMISSIONS } from "../../src/constants/permissions";

export async function seedPermissions(prisma: PrismaClient) {
  console.log("Seeding permissions...");
  const permissions = [];

  for (const { resource, action, code, description } of FLAT_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: { description }, // keep description in sync if it changes
      create: {
        code,
        resource,
        action,
        description,
      },
    });
    permissions.push(permission);
  }

  console.log(`Seeded ${permissions.length} permissions.`);
  return permissions;
}
