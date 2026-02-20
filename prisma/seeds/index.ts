import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { seedAdmin } from "./admin.seed";
import { seedProducts } from "./product.seed";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting database seeding...\n");

  try {
    // seedAdmin internally calls seedPermissions first, then creates the super admin
    await seedAdmin(prisma);
    // Seed products and categories
    await seedProducts();

    console.log("🎉 All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
