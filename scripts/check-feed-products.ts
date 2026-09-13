import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const products = await prisma.feedProduct.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      farmId: true,
    },
    orderBy: [
      { farmId: "asc" },
      { type: "asc" },
    ],
  });

  console.log("\nFeed products in the database:\n");
  console.table(products);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });