import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { applySupplierCashierStockDelta } from "./cashier-inventory.service.js";

type SupplierPayload = {
  name: string;
  notes?: string | null;
  phone?: string | null;
};

type NewProductPayload = {
  barcode?: string | null;
  categoryId: number;
  costPrice: number;
  description?: string | null;
  name: string;
  salePrice: number;
  unit?: string;
  weight?: number | null;
};

type PurchaseItemPayload = {
  id?: number;
  productId?: number;
  newProduct?: NewProductPayload;
  quantity: number;
  salePrice: number;
  unitCost: number;
};

type PurchasePayload = {
  chequeCreditDate: Date;
  items: PurchaseItemPayload[];
  notes?: string | null;
  purchaseDate: Date;
  referenceNumber?: string | null;
  supplierId: number;
};

type PurchaseTransaction = Prisma.TransactionClient;

const purchaseInclude = {
  items: {
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      id: "asc",
    },
  },
  supplier: true,
} satisfies Prisma.SupplierPurchaseInclude;

function normalizeNullableText(value?: string | null) {
  return value?.trim() || null;
}

function calculateTotalAmount(items: PurchaseItemPayload[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
}

async function assertSupplierExists(tx: PurchaseTransaction, supplierId: number) {
  const supplier = await tx.supplier.findUnique({
    where: {
      id: supplierId,
    },
  });

  if (!supplier) {
    throw new Error("Supplier was not found");
  }
}

async function assertCategoryExists(tx: PurchaseTransaction, categoryId: number) {
  const category = await tx.category.findUnique({
    where: {
      id: categoryId,
    },
    select: {
      id: true,
    },
  });

  if (!category) {
    throw new Error("Selected category does not exist");
  }
}

async function resolveProductId(tx: PurchaseTransaction, item: PurchaseItemPayload) {
  if (item.productId) {
    const product = await tx.product.findUnique({
      where: {
        id: item.productId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new Error("One or more selected products were not found");
    }

    await tx.product.update({
      where: {
        id: item.productId,
      },
      data: {
        costPrice: item.unitCost,
        price: item.salePrice,
      },
    });

    return item.productId;
  }

  const newProduct = item.newProduct;

  if (!newProduct) {
    throw new Error("Each purchase item needs a product");
  }

  await assertCategoryExists(tx, newProduct.categoryId);

  const product = await tx.product.create({
    data: {
      barcode: normalizeNullableText(newProduct.barcode),
      categoryId: newProduct.categoryId,
      costPrice: item.unitCost,
      description: normalizeNullableText(newProduct.description),
      name: newProduct.name.trim(),
      price: item.salePrice,
      stock: 0,
      unit: newProduct.unit?.trim() || "pcs",
      weight: newProduct.weight ?? null,
    },
    select: {
      id: true,
    },
  });

  return product.id;
}

async function applyStockDelta(
  tx: PurchaseTransaction,
  productId: number,
  quantityDelta: number,
  note: string
) {
  if (quantityDelta === 0) {
    return;
  }

  if (quantityDelta < 0) {
    const product = await tx.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        name: true,
        stock: true,
      },
    });

    if (!product) {
      throw new Error("One or more selected products were not found");
    }

    if (product.stock + quantityDelta < 0) {
      throw new Error(`Not enough stock to reduce received quantity for ${product.name}`);
    }
  }

  await tx.product.update({
    where: {
      id: productId,
    },
    data: {
      stock: {
        increment: quantityDelta,
      },
    },
  });

  await tx.inventoryLog.create({
    data: {
      note,
      productId,
      quantity: quantityDelta,
      type: quantityDelta > 0 ? "SUPPLIER_RECEIVE" : "SUPPLIER_PURCHASE_EDIT",
    },
  });

  await applySupplierCashierStockDelta(tx, productId, quantityDelta);
}

async function createPurchaseItem(
  tx: PurchaseTransaction,
  purchaseId: number,
  item: PurchaseItemPayload
) {
  const productId = await resolveProductId(tx, item);
  const lineTotal = item.quantity * item.unitCost;

  await tx.supplierPurchaseItem.create({
    data: {
      lineTotal,
      productId,
      purchaseId,
      quantity: item.quantity,
      salePrice: item.salePrice,
      unitCost: item.unitCost,
    },
  });

  await applyStockDelta(
    tx,
    productId,
    item.quantity,
    `Received from supplier purchase #${purchaseId}`
  );
}

export const SupplierService = {
  async getSuppliers() {
    return prisma.supplier.findMany({
      orderBy: {
        name: "asc",
      },
    });
  },

  async createSupplier(data: SupplierPayload) {
    return prisma.supplier.create({
      data: {
        name: data.name.trim(),
        notes: normalizeNullableText(data.notes),
        phone: normalizeNullableText(data.phone),
      },
    });
  },

  async updateSupplier(id: number, data: SupplierPayload) {
    return prisma.supplier.update({
      where: {
        id,
      },
      data: {
        name: data.name.trim(),
        notes: normalizeNullableText(data.notes),
        phone: normalizeNullableText(data.phone),
      },
    });
  },

  async getPurchases() {
    return prisma.supplierPurchase.findMany({
      include: purchaseInclude,
      orderBy: {
        purchaseDate: "desc",
      },
    });
  },

  async createPurchase(data: PurchasePayload) {
    return prisma.$transaction(async (tx) => {
      await assertSupplierExists(tx, data.supplierId);

      const purchase = await tx.supplierPurchase.create({
        data: {
          chequeCreditDate: data.chequeCreditDate,
          notes: normalizeNullableText(data.notes),
          purchaseDate: data.purchaseDate,
          referenceNumber: normalizeNullableText(data.referenceNumber),
          supplierId: data.supplierId,
          totalAmount: calculateTotalAmount(data.items),
        },
      });

      for (const item of data.items) {
        await createPurchaseItem(tx, purchase.id, item);
      }

      return tx.supplierPurchase.findUniqueOrThrow({
        where: {
          id: purchase.id,
        },
        include: purchaseInclude,
      });
    });
  },

  async updatePurchase(id: number, data: PurchasePayload) {
    return prisma.$transaction(async (tx) => {
      await assertSupplierExists(tx, data.supplierId);

      const existingPurchase = await tx.supplierPurchase.findUnique({
        where: {
          id,
        },
        include: {
          items: true,
        },
      });

      if (!existingPurchase) {
        throw new Error("Supplier purchase was not found");
      }

      const existingItemsById = new Map(existingPurchase.items.map((item) => [item.id, item]));
      const seenItemIds = new Set<number>();

      await tx.supplierPurchase.update({
        where: {
          id,
        },
        data: {
          chequeCreditDate: data.chequeCreditDate,
          notes: normalizeNullableText(data.notes),
          purchaseDate: data.purchaseDate,
          referenceNumber: normalizeNullableText(data.referenceNumber),
          supplierId: data.supplierId,
          totalAmount: calculateTotalAmount(data.items),
        },
      });

      for (const item of data.items) {
        if (item.id && existingItemsById.has(item.id)) {
          const existingItem = existingItemsById.get(item.id)!;

          if (item.productId && item.productId !== existingItem.productId) {
            throw new Error("Existing purchase items cannot change products");
          }

          const productId = existingItem.productId;
          const quantityDelta = item.quantity - existingItem.quantity;

          await tx.supplierPurchaseItem.update({
            where: {
              id: item.id,
            },
            data: {
              lineTotal: item.quantity * item.unitCost,
              quantity: item.quantity,
              salePrice: item.salePrice,
              unitCost: item.unitCost,
            },
          });

          await tx.product.update({
            where: {
              id: productId,
            },
            data: {
              costPrice: item.unitCost,
              price: item.salePrice,
            },
          });

          await applyStockDelta(
            tx,
            productId,
            quantityDelta,
            `Adjusted supplier purchase #${id}`
          );
          seenItemIds.add(item.id);
          continue;
        }

        await createPurchaseItem(tx, id, item);
      }

      for (const existingItem of existingPurchase.items) {
        if (seenItemIds.has(existingItem.id)) {
          continue;
        }

        await applyStockDelta(
          tx,
          existingItem.productId,
          -existingItem.quantity,
          `Removed from supplier purchase #${id}`
        );
        await tx.supplierPurchaseItem.delete({
          where: {
            id: existingItem.id,
          },
        });
      }

      return tx.supplierPurchase.findUniqueOrThrow({
        where: {
          id,
        },
        include: purchaseInclude,
      });
    });
  },
};
