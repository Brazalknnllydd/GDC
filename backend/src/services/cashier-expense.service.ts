import { Prisma, type PrismaClient } from "@prisma/client";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

type ReportRange = {
  endDate?: Date | undefined;
  startDate?: Date | undefined;
};

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  return Number(value ?? 0) || 0;
}

function buildDateWhere(range: ReportRange) {
  if (!range.startDate && !range.endDate) {
    return undefined;
  }

  return {
    ...(range.startDate ? { gte: range.startDate } : {}),
    ...(range.endDate ? { lte: range.endDate } : {}),
  };
}

export async function createCashierExpense(
  prisma: PrismaLike,
  userId: number,
  amount: number,
  description: string,
  expenseDate = new Date(),
  requestedShiftId?: number | null
) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Expense amount must be greater than zero");
  }

  if (!description.trim()) {
    throw new Error("Expense description is required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user || user.role.name !== "Cashier") {
    throw new Error("Only cashier users can record expenses");
  }

  const shift = requestedShiftId
    ? await prisma.shift.findFirst({
        where: { id: requestedShiftId, userId },
      })
    : await prisma.shift.findFirst({
        where: { userId, status: "OPEN" },
        orderBy: { startedAt: "desc" },
      });

  if (!shift) {
    throw new Error("An active cashier shift is required to record expenses");
  }

  return prisma.cashierExpense.create({
    data: {
      amount: new Prisma.Decimal(amount),
      description: description.trim(),
      expenseDate,
      shiftId: shift.id,
      userId,
    },
    include: {
      shift: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
  });
}

export function getCashierExpenses(prisma: PrismaLike, userId: number, shiftId?: number) {
  return prisma.cashierExpense.findMany({
    where: {
      userId,
      ...(shiftId ? { shiftId } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      expenseDate: "desc",
    },
  });
}

export async function getCashierReportSummary(prisma: PrismaLike, range: ReportRange) {
  const cashiers = await prisma.user.findMany({
    where: {
      role: {
        name: "Cashier",
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  const cashierIds = cashiers.map((cashier) => cashier.id);
  const saleDateWhere = buildDateWhere(range);
  const expenseDateWhere = buildDateWhere(range);

  const [sales, expenses, inventories, priceOverrides] = await Promise.all([
    prisma.sale.findMany({
      where: {
        userId: { in: cashierIds },
        saleType: "CUSTOMER",
        status: "completed",
        ...(saleDateWhere ? { createdAt: saleDateWhere } : {}),
      },
      select: {
        createdAt: true,
        discountAmount: true,
        paymentMethod: true,
        totalAmount: true,
        userId: true,
      },
    }),
    prisma.cashierExpense.findMany({
      where: {
        userId: { in: cashierIds },
        ...(expenseDateWhere ? { expenseDate: expenseDateWhere } : {}),
      },
      select: {
        amount: true,
        userId: true,
      },
    }),
    prisma.cashierInventory.findMany({
      where: {
        cashierId: { in: cashierIds },
        quantity: { gt: 0 },
      },
      include: {
        product: {
          select: {
            id: true,
            price: true,
          },
        },
      },
    }),
    prisma.cashierProductPrice.findMany({
      where: {
        cashierId: { in: cashierIds },
      },
      select: {
        cashierId: true,
        price: true,
        productId: true,
      },
    }),
  ]);

  const priceOverrideByCashierProduct = new Map(
    priceOverrides.map((entry) => [`${entry.cashierId}:${entry.productId}`, entry.price])
  );

  const inventoryValueByCashier = new Map<number, number>();
  for (const inventory of inventories) {
    const price =
      priceOverrideByCashierProduct.get(`${inventory.cashierId}:${inventory.productId}`) ??
      inventory.product.price;
    const value = inventory.quantity * toNumber(price);

    inventoryValueByCashier.set(
      inventory.cashierId,
      (inventoryValueByCashier.get(inventory.cashierId) ?? 0) + value
    );
  }

  const summaryByCashier = new Map(
    cashiers.map((cashier) => [
      cashier.id,
      {
        beginning: inventoryValueByCashier.get(cashier.id) ?? 0,
        cash: 0,
        cashierId: cashier.id,
        cashierName: cashier.name,
        credit: 0,
        date: {
          endDate: range.endDate?.toISOString() ?? null,
          startDate: range.startDate?.toISOString() ?? null,
        },
        expenses: 0,
        gcash: 0,
        leftOver: inventoryValueByCashier.get(cashier.id) ?? 0,
        lessPriceDiscount: 0,
        payments: 0,
        payables: 0,
        total: 0,
        username: cashier.username,
      },
    ])
  );

  for (const sale of sales) {
    const summary = summaryByCashier.get(sale.userId);
    if (!summary) continue;

    const totalAmount = toNumber(sale.totalAmount);
    const paymentMethod = sale.paymentMethod.trim().toLowerCase();

    if (paymentMethod === "cash") {
      summary.cash += totalAmount;
    } else if (paymentMethod === "gcash") {
      summary.gcash += totalAmount;
    } else if (paymentMethod === "utang") {
      summary.credit += totalAmount;
      summary.payables += totalAmount;
    }

    summary.lessPriceDiscount += toNumber(sale.discountAmount);
  }

  for (const expense of expenses) {
    const summary = summaryByCashier.get(expense.userId);
    if (!summary) continue;

    summary.expenses += toNumber(expense.amount);
  }

  for (const summary of summaryByCashier.values()) {
    summary.total = summary.cash + summary.gcash + summary.credit;
    summary.payments = summary.cash + summary.gcash;
  }

  return Array.from(summaryByCashier.values());
}
