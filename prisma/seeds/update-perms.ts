import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { seedAdmin } from "./admin.seed";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Updating permissions only...\n");

  try {
    // This will upsert all permissions defined in constants/permissions.ts
    // and assign them to the super admin defined in .env
    await seedAdmin(prisma);

    console.log("🎉 Permissions updated successfully!");
  } catch (error) {
    console.error("❌ Error during update:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
