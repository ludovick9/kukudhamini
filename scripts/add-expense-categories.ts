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

const categories = [
  "Chicks",
  "Feed",
  "Medicine",
  "Utilities",
  "Labour",
  "Transport",
  "Equipment",
  "Coal",
  "Electricity",
  "Water",
  "Bedding",
];

async function main() {
  console.log(`Adding expense categories to farm: ${farmId}`);

  for (const name of categories) {
    const category = await prisma.expenseCategory.upsert({
      where: {
        farmId_name: {
          farmId,
          name,
        },
      },
      update: {},
      create: {
        farmId,
        name,
      },
    });

    console.log(`✓ ${category.name}`);
  }

  console.log("\nAll expense categories are ready.");
}

main()
  .catch((error) => {
    console.error("\nFailed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });