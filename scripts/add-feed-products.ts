import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const farmId = "cmtx06isz000104l3wvm94204";

const products = [
  {
    name: "grower",
    type: "GROWER" as const,
    lowStockThreshold: 250,
  },
  {
    name: "finisher",
    type: "FINISHER" as const,
    lowStockThreshold: 220,
  },
];

async function main() {
  console.log(`Adding feed products to farm: ${farmId}`);

  for (const product of products) {
    const result = await prisma.feedProduct.upsert({
      where: {
        farmId_type: {
          farmId,
          type: product.type,
        },
      },
      update: {},
      create: {
        farmId,
        name: product.name,
        type: product.type,
        lowStockThreshold: product.lowStockThreshold,
      },
    });

    console.log(`✓ ${result.name} (${result.type})`);
  }

  console.log("\nAll standard feed products are ready.");
}

main()
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });