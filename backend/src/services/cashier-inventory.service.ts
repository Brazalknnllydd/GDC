import type { Prisma } from "@prisma/client";

type InventoryTransaction = Prisma.TransactionClient;

const supplierCashierUsernames = ["cashier-a", "cashier-b"] as const;
const recipientCashierUsernames = ["cashier-c", "cashier-d"] as const;

function assertPositiveQuantity(quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Inventory quantity must be greater than zero");
  }
}

function splitQuantityForSupplierCashiers(quantity: number) {
  if (Number.isInteger(quantity)) {
    const firstQuantity = Math.ceil(quantity / 2);
    return [firstQuantity, quantity - firstQuantity] as const;
  }

  const firstQuantity = quantity / 2;
  return [firstQuantity, quantity - firstQuantity] as const;
}

export function isSupplierCashier(username?: string | null) {
  return supplierCashierUsernames.includes(username as (typeof supplierCashierUsernames)[number]);
}

export function isRecipientCashier(username?: string | null) {
  return recipientCashierUsernames.includes(username as (typeof recipientCashierUsernames)[number]);
}

export async function getInternalRecipientCashiers(tx: InventoryTransaction) {
  return tx.user.findMany({
    where: {
      username: {
        in: [...recipientCashierUsernames],
      },
      role: {
        name: "Cashier",
      },
    },
    orderBy: {
      username: "asc",
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });
}

export async function getCashierInventoryRows(tx: InventoryTransaction) {
  const rows = await tx.cashierInventory.findMany({
    where: {
      quantity: {
        gt: 0,
      },
    },
    include: {
      cashier: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
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
    orderBy: [
      {
        cashier: {
          username: "asc",
        },
      },
      {
        product: {
          name: "asc",
        },
      },
      {
        sourceCashier: {
          username: "asc",
        },
      },
    ],
  });

  const priceOverrides = rows.length > 0
    ? await tx.cashierProductPrice.findMany({
        where: {
          OR: rows.map((row) => ({
            cashierId: row.cashierId,
            productId: row.productId,
          })),
        },
        select: {
          cashierId: true,
          productId: true,
          price: true,
        },
      })
    : [];
  const priceOverrideByKey = new Map(
    priceOverrides.map((override) => [
      `${override.cashierId}-${override.productId}`,
      override.price,
    ])
  );

  return rows.map((row) => ({
    cashierPrice: priceOverrideByKey.get(`${row.cashierId}-${row.productId}`) ?? null,
    cashier: row.cashier,
    product: row.product,
    quantity: row.quantity,
    sourceCashier: row.sourceCashier,
  }));
}

export async function getCashierProductPrice(
  tx: InventoryTransaction,
  cashierId: number,
  productId: number
) {
  const override = await tx.cashierProductPrice.findUnique({
    where: {
      cashierId_productId: {
        cashierId,
        productId,
      },
    },
    select: {
      price: true,
    },
  });

  return override?.price ?? null;
}

export async function setRecipientCashierProductPrice(
  tx: InventoryTransaction,
  cashierId: number,
  productId: number,
  price: number | null
) {
  const cashier = await tx.user.findUnique({
    where: {
      id: cashierId,
    },
    include: {
      role: true,
    },
  });

  if (!cashier || cashier.role.name !== "Cashier" || !isRecipientCashier(cashier.username)) {
    throw new Error("Price overrides are only allowed for Cashier C and Cashier D");
  }

  const product = await tx.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      price: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (price === null) {
    await tx.cashierProductPrice.deleteMany({
      where: {
        cashierId,
        productId,
      },
    });

    return {
      cashierId,
      productId,
      price: null,
      effectivePrice: product.price,
    };
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price must be a valid non-negative number");
  }

  const savedPrice = await tx.cashierProductPrice.upsert({
    where: {
      cashierId_productId: {
        cashierId,
        productId,
      },
    },
    update: {
      price,
    },
    create: {
      cashierId,
      productId,
      price,
    },
  });

  return {
    cashierId,
    productId,
    price: savedPrice.price,
    effectivePrice: savedPrice.price,
  };
}

export async function allocateStockToSupplierCashiers(
  tx: InventoryTransaction,
  productId: number,
  quantity: number
) {
  if (quantity <= 0) {
    return;
  }

  const supplierCashiers = await tx.user.findMany({
    where: {
      username: {
        in: [...supplierCashierUsernames],
      },
      role: {
        name: "Cashier",
      },
    },
    orderBy: {
      username: "asc",
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (supplierCashiers.length !== supplierCashierUsernames.length) {
    throw new Error("Cashier A and Cashier B must be seeded before assigning stock");
  }

  const [cashierA, cashierB] = supplierCashiers;

  if (!cashierA || !cashierB) {
    throw new Error("Cashier A and Cashier B must be seeded before assigning stock");
  }

  const [firstQuantity, secondQuantity] = splitQuantityForSupplierCashiers(quantity);
  const allocations = [
    { cashierId: cashierA.id, quantity: firstQuantity },
    { cashierId: cashierB.id, quantity: secondQuantity },
  ];

  for (const allocation of allocations) {
    if (allocation.quantity <= 0) {
      continue;
    }

    await tx.cashierInventory.upsert({
      where: {
        cashierId_productId_sourceCashierId: {
          cashierId: allocation.cashierId,
          productId,
          sourceCashierId: allocation.cashierId,
        },
      },
      update: {
        quantity: {
          increment: allocation.quantity,
        },
      },
      create: {
        cashierId: allocation.cashierId,
        productId,
        quantity: allocation.quantity,
        sourceCashierId: allocation.cashierId,
      },
    });
  }
}

export async function decrementSupplierCashierInventory(
  tx: InventoryTransaction,
  productId: number,
  quantity: number
) {
  if (quantity <= 0) {
    return;
  }

  const supplierCashiers = await tx.user.findMany({
    where: {
      username: {
        in: [...supplierCashierUsernames],
      },
      role: {
        name: "Cashier",
      },
    },
    orderBy: {
      username: "asc",
    },
    select: {
      id: true,
    },
  });

  let remainingQuantity = quantity;

  for (const cashier of supplierCashiers) {
    if (remainingQuantity <= 0) {
      break;
    }

    const availableQuantity = await getCashierProductQuantity(tx, cashier.id, productId);
    const consumedQuantity = Math.min(availableQuantity, remainingQuantity);

    if (consumedQuantity <= 0) {
      continue;
    }

    await decrementCashierInventory(tx, cashier.id, productId, consumedQuantity);
    remainingQuantity -= consumedQuantity;
  }

  if (remainingQuantity > 0) {
    throw new Error("Insufficient Cashier A/B inventory to reduce stock");
  }
}

export async function applySupplierCashierStockDelta(
  tx: InventoryTransaction,
  productId: number,
  quantityDelta: number
) {
  if (quantityDelta > 0) {
    await allocateStockToSupplierCashiers(tx, productId, quantityDelta);
    return;
  }

  if (quantityDelta < 0) {
    await decrementSupplierCashierInventory(tx, productId, Math.abs(quantityDelta));
  }
}

export async function getCashierProductQuantity(
  tx: InventoryTransaction,
  cashierId: number,
  productId: number
) {
  const aggregate = await tx.cashierInventory.aggregate({
    where: {
      cashierId,
      productId,
    },
    _sum: {
      quantity: true,
    },
  });

  return aggregate._sum.quantity ?? 0;
}

export async function decrementCashierInventory(
  tx: InventoryTransaction,
  cashierId: number,
  productId: number,
  quantity: number,
  sourceCashierId?: number
) {
  assertPositiveQuantity(quantity);

  let remainingQuantity = quantity;
  const rows = await tx.cashierInventory.findMany({
    where: {
      cashierId,
      productId,
      ...(typeof sourceCashierId === "number" ? { sourceCashierId } : {}),
      quantity: {
        gt: 0,
      },
    },
    orderBy: [
      {
        createdAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const availableQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);

  if (availableQuantity < quantity) {
    throw new Error("Insufficient cashier inventory");
  }

  const consumedRows: { quantity: number; sourceCashierId: number }[] = [];

  for (const row of rows) {
    if (remainingQuantity <= 0) {
      break;
    }

    const consumedQuantity = Math.min(row.quantity, remainingQuantity);
    remainingQuantity -= consumedQuantity;

    await tx.cashierInventory.update({
      where: {
        id: row.id,
      },
      data: {
        quantity: {
          decrement: consumedQuantity,
        },
      },
    });

    consumedRows.push({
      quantity: consumedQuantity,
      sourceCashierId: row.sourceCashierId,
    });
  }

  return consumedRows;
}

export async function incrementCashierInventory(
  tx: InventoryTransaction,
  cashierId: number,
  productId: number,
  sourceCashierId: number,
  quantity: number
) {
  assertPositiveQuantity(quantity);

  await tx.cashierInventory.upsert({
    where: {
      cashierId_productId_sourceCashierId: {
        cashierId,
        productId,
        sourceCashierId,
      },
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
    create: {
      cashierId,
      productId,
      quantity,
      sourceCashierId,
    },
  });
}
