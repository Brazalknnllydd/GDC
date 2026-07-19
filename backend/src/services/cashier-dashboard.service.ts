import { prisma } from "../lib/prisma.js";

function getStartOfToday() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfTomorrow() {
  const startOfToday = getStartOfToday();

  return new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    startOfToday.getDate() + 1
  );
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  return Number(value ?? 0) || 0;
}

export async function getCashierDashboard(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      cashierCategoryAccesses: {
        include: {
          category: true,
        },
      },
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const latestShift = await prisma.shift.findFirst({
    where: {
      userId,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  const todaySales = latestShift?.status === 'OPEN' ? await prisma.sale.findMany({
    where: {
      userId,
      shiftId: latestShift.id,
    },
    include: {
      customer: {
        select: { name: true },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  }) : [];

  const recentSales = todaySales.map((sale) => ({
    id: sale.id,
    customerName: sale.customer?.name ?? null,
    paymentMethod: sale.paymentMethod,
    receiptNumber: sale.receiptNumber,
    time: sale.createdAt.toISOString(),
    totalAmount: toNumber(sale.totalAmount),
    subtotal: toNumber(sale.subtotal),
    discountAmount: toNumber(sale.discountAmount),
    amountPaid: toNumber(sale.amountPaid),
    changeAmount: toNumber(sale.changeAmount),
    cashierName: sale.user?.name || "Cashier",
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((item) => ({
      price: toNumber(item.price),
      product: { name: item.product?.name || "Item" },
      quantity: item.quantity,
      subtotal: toNumber(item.subtotal),
    })),
  }));

  const salesToday = todaySales.reduce(
    (sum, sale) => sum + toNumber(sale.totalAmount),
    0
  );
  const itemsSold = todaySales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((itemSum, item) => itemSum + toNumber(item.quantity), 0),
    0
  );
  const paymentBreakdownMap = todaySales.reduce((accumulator, sale) => {
    const key = sale.paymentMethod?.trim() || "Cash";
    const currentTotal = accumulator.get(key) ?? 0;

    accumulator.set(key, currentTotal + toNumber(sale.totalAmount));

    return accumulator;
  }, new Map<string, number>());

  const paymentBreakdown = Array.from(paymentBreakdownMap.entries())
    .map(([method, total]) => ({
      method,
      total,
    }))
    .sort((left, right) => right.total - left.total);

  const cashSalesTotal =
    paymentBreakdown.find((entry) => entry.method.toLowerCase() === "cash")?.total ?? 0;

  let cashReceived = 0;
  let changeGiven = 0;
  for (const sale of todaySales) {
    if (sale.paymentMethod.trim().toLowerCase() === "cash") {
      cashReceived += toNumber(sale.amountPaid);
      changeGiven += toNumber(sale.changeAmount);
    }
  }

  return {
    cashier: {
      allowedCategories: user.cashierCategoryAccesses
        .map((entry) => ({
          id: entry.category.id,
          name: entry.category.name,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
      id: user.id,
      name: user.name,
      role: user.role.name,
      username: user.username,
    },
    currentShift: latestShift
      ? {
          id: latestShift.id,
          durationMinutes: Math.max(
            0,
            Math.floor(
              ((latestShift.endedAt ?? new Date()).getTime() - latestShift.startedAt.getTime()) /
                60000
            )
          ),
          expectedCashOnHand: toNumber(latestShift.openingCash) + cashSalesTotal,
          openingCash: toNumber(latestShift.openingCash),
          startedAt: latestShift.startedAt.toISOString(),
          status: latestShift.endedAt ? "Closed Shift" : "Active Shift",
        }
      : null,
    paymentBreakdown,
    performance: {
      itemsSold,
      salesToday,
      served: todaySales.length,
      transactions: todaySales.length,
    },
    recentSales,
    totals: {
      drawerVariance: latestShift && latestShift.closingCash !== null
        ? toNumber(latestShift.closingCash) - (toNumber(latestShift.openingCash) + cashSalesTotal)
        : 0,
      totalReportedSales: salesToday,
      cashReceived,
      changeGiven,
    },
  };
}
