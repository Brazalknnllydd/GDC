import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const cashierSeeds = [
  { name: "Cashier A", username: "cashier-a" },
  { name: "Cashier B", username: "cashier-b" },
  { name: "Cashier C", username: "cashier-c" },
  { name: "Cashier D", username: "cashier-d" },
];

async function clearApplicationData() {
  await prisma.$transaction([
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.cashierExpense.deleteMany(),
    prisma.shift.deleteMany(),
    prisma.inventoryLog.deleteMany(),
    prisma.supplierPurchaseItem.deleteMany(),
    prisma.supplierPurchase.deleteMany(),
    prisma.cashierInventory.deleteMany(),
    prisma.cashierProductPrice.deleteMany(),
    prisma.cashierCategoryAccess.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
  ]);
}

async function main() {
  await clearApplicationData();

  const [adminRole, cashierRole] = await Promise.all([
    prisma.role.create({ data: { name: "Admin" } }),
    prisma.role.create({ data: { name: "Cashier" } }),
  ]);

  const [adminPassword, cashierPassword] = await Promise.all([
    bcrypt.hash("adminGDC2026@", 10),
    bcrypt.hash("cashier2026@", 10),
  ]);

  await prisma.user.create({
    data: {
      name: "GDC Admin",
      password: adminPassword,
      roleId: adminRole.id,
      username: "admin",
    },
  });

  await prisma.user.createMany({
    data: cashierSeeds.map((cashier) => ({
      name: cashier.name,
      password: cashierPassword,
      roleId: cashierRole.id,
      username: cashier.username,
    })),
  });

  console.log("Deployment seed completed: database reset and default accounts created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
