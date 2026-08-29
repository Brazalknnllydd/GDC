import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Keep deployment data clean: remove any seeded/demo product records first.
  // This preserves users/roles while clearing catalog data for a fresh deploy.
  await prisma.inventoryLog.deleteMany({});
  await prisma.product.deleteMany({});

  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: {},
    create: { name: "Admin" },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: "Cashier" },
    update: {},
    create: { name: "Cashier" },
  });

  const [adminPassword, cashierPassword] = await Promise.all([
    bcrypt.hash("adminGDC2026@", 10),
    bcrypt.hash("cashier123", 10),
  ]);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      name: "GDC Admin",
      password: adminPassword,
      roleId: adminRole.id,
    },
    create: {
      name: "GDC Admin",
      username: "admin",
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { username: "cashier" },
    update: {
      name: "Juan Dela Cruz",
      password: cashierPassword,
      roleId: cashierRole.id,
    },
    create: {
      name: "Juan Dela Cruz",
      username: "cashier",
      password: cashierPassword,
      roleId: cashierRole.id,
    },
  });

  const shiftStartedAt = new Date();
  shiftStartedAt.setHours(8, 0, 0, 0);

  const existingOpenShift = await prisma.shift.findFirst({
    where: {
      endedAt: null,
      userId: cashierUser.id,
    },
  });

  if (!existingOpenShift) {
    await prisma.shift.create({
      data: {
        openingCash: 2000,
        startedAt: shiftStartedAt,
        userId: cashierUser.id,
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
