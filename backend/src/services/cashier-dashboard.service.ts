import { prisma } from "../lib/prisma.js";
import {
  getInternalRecipientCashiers,
  isSupplierCashier,
} from "./cashier-inventory.service.js";

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

  const activeShift = await prisma.shift.findFirst({
    where: {
      userId,
      endedAt: null,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  const todaySales = activeShift
    ? await prisma.sale.findMany({
    where: {
      userId,
      shiftId: activeShift.id,
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
      recipientUser: {
        select: {
          id: true,
          name: true,
          username: true,
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
    })
    : [];

  const recentSales = todaySales.map((sale) => ({
    id: sale.id,
    customerName: sale.customer?.name ?? null,
    paymentMethod: sale.paymentMethod,
    status: sale.status,
    receiptNumber: sale.receiptNumber,
    time: sale.createdAt.toISOString(),
    totalAmount: toNumber(sale.totalAmount),
    subtotal: toNumber(sale.subtotal),
    discountAmount: toNumber(sale.discountAmount),
    amountPaid: toNumber(sale.amountPaid),
    changeAmount: toNumber(sale.changeAmount),
    cashierName: sale.user?.name || "Cashier",
    recipientCashierName: sale.recipientUser?.name ?? null,
    recipientUserId: sale.recipientUserId,
    saleType: sale.saleType,
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((item) => ({
      price: toNumber(item.price),
      product: { name: item.product?.name || "Item" },
      quantity: item.quantity,
      subtotal: toNumber(item.subtotal),
    })),
  }));

  const completedSales = todaySales.filter(
    (sale) => sale.status !== "voided" && sale.saleType === "CUSTOMER"
  );
  const completedCashSalesTotal = todaySales
    .filter((sale) => sale.status === "completed" && sale.paymentMethod.trim().toLowerCase() === "cash")
    .reduce((sum, sale) => sum + toNumber(sale.totalAmount), 0);
  const recentExpenses = activeShift
    ? await prisma.cashierExpense.findMany({
        where: {
          shiftId: activeShift.id,
          userId,
        },
        orderBy: {
          expenseDate: "desc",
        },
      })
    : [];
  const expensesTotal = recentExpenses.reduce(
    (sum, expense) => sum + toNumber(expense.amount),
    0
  );

  const salesToday = completedSales.reduce(
    (sum, sale) => sum + toNumber(sale.totalAmount),
    0
  );
  const itemsSold = completedSales.reduce(
    (sum, sale) =>
      sum +
      sale.items.reduce((itemSum, item) => itemSum + toNumber(item.quantity), 0),
    0
  );
  const paymentBreakdownMap = completedSales.reduce((accumulator, sale) => {
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

  let cashReceived = 0;
  let changeGiven = 0;
  for (const sale of completedSales) {
    if (sale.paymentMethod.trim().toLowerCase() === "cash") {
      cashReceived += toNumber(sale.amountPaid);
      changeGiven += toNumber(sale.changeAmount);
    }
  }

  const inventoryRows = await prisma.cashierInventory.findMany({
    where: {
      cashierId: user.id,
      quantity: {
        gt: 0,
      },
    },
    include: {
      product: {
        include: {
          category: true,
        },
      },
      sourceCashier: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      product: {
        name: "asc",
      },
    },
  });

  const productsById = new Map<number, {
    product: (typeof inventoryRows)[number]["product"];
    sourceCashiers: { id: number; name: string; quantity: number; username: string }[];
    stock: number;
  }>();

  for (const row of inventoryRows) {
    const current = productsById.get(row.productId) ?? {
      product: row.product,
      sourceCashiers: [],
      stock: 0,
    };

    current.stock += row.quantity;
    current.sourceCashiers.push({
      id: row.sourceCashier.id,
      name: row.sourceCashier.name,
      quantity: row.quantity,
      username: row.sourceCashier.username,
    });
    productsById.set(row.productId, current);
  }

  const cashierProductPrices = await prisma.cashierProductPrice.findMany({
    where: {
      cashierId: user.id,
      productId: {
        in: Array.from(productsById.keys()),
      },
    },
    select: {
      productId: true,
      price: true,
    },
  });
  const priceByProductId = new Map(
    cashierProductPrices.map((entry) => [entry.productId, entry.price])
  );

  const inventoryProducts = Array.from(productsById.values()).map((entry) => ({
    ...entry.product,
    cashierPrice: priceByProductId.get(entry.product.id) ?? null,
    defaultPrice: entry.product.price,
    price: priceByProductId.get(entry.product.id) ?? entry.product.price,
    stock: entry.stock,
    sourceCashiers: entry.sourceCashiers,
  }));

  const internalRecipientCashiers = isSupplierCashier(user.username)
    ? await getInternalRecipientCashiers(prisma)
    : [];

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
      canSupplyCashiers: isSupplierCashier(user.username),
    },
    currentShift: activeShift
      ? {
          id: activeShift.id,
          durationMinutes: Math.max(
            0,
            Math.floor(
              ((activeShift.endedAt ?? new Date()).getTime() - activeShift.startedAt.getTime()) /
                60000
            )
          ),
          expectedCashOnHand: toNumber(activeShift.openingCash) + completedCashSalesTotal - expensesTotal,
          openingCash: toNumber(activeShift.openingCash),
          startedAt: activeShift.startedAt.toISOString(),
          status: activeShift.endedAt ? "Closed Shift" : "Active Shift",
        }
      : null,
    paymentBreakdown,
    internalRecipientCashiers,
    inventoryProducts,
    performance: {
      itemsSold,
      salesToday,
      served: completedSales.length,
      transactions: completedSales.length,
    },
    recentExpenses: recentExpenses.map((expense) => ({
      amount: toNumber(expense.amount),
      createdAt: expense.createdAt.toISOString(),
      description: expense.description,
      expenseDate: expense.expenseDate.toISOString(),
      id: expense.id,
      shiftId: expense.shiftId,
    })),
    recentSales,
    totals: {
      drawerVariance: activeShift && activeShift.closingCash !== null
        ? toNumber(activeShift.closingCash) - (toNumber(activeShift.openingCash) + completedCashSalesTotal - expensesTotal)
        : 0,
      totalReportedSales: salesToday,
      cashReceived,
      changeGiven,
      expenses: expensesTotal,
    },
  };
}
