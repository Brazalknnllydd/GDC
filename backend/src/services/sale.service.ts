import { prisma } from "../lib/prisma.js";

const allowedPaymentMethods = new Set(["Cash", "GCash"]);

export type SaleItemInput = {
  productId: number;
  quantity: number;
  price: number;
  subtotal: number;
};

export type CreateSaleInput = {
  receiptNumber: string;
  subtotal: number;
  discountAmount?: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod?: string;
  customerId?: number | null;
  userId: number;
  shiftId?: number | null;
  items: SaleItemInput[];
};

export function isValidSaleItem(item: unknown): item is SaleItemInput {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as Record<string, unknown>;

  return (
    typeof candidate.productId === "number" &&
    typeof candidate.quantity === "number" &&
    typeof candidate.price === "number" &&
    typeof candidate.subtotal === "number"
  );
}

export async function createSaleWithInventoryUpdate({
  receiptNumber,
  subtotal,
  discountAmount = 0,
  totalAmount,
  amountPaid,
  changeAmount,
  paymentMethod = "Cash",
  customerId,
  userId,
  shiftId,
  items,
}: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const normalizedPaymentMethod = paymentMethod.trim() || "Cash";

    if (!allowedPaymentMethods.has(normalizedPaymentMethod)) {
      throw new Error("Payment method must be Cash or GCash");
    }

    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        cashierCategoryAccesses: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const restrictedCategoryIds = new Set(
      user.cashierCategoryAccesses.map((entry) => entry.categoryId)
    );

    if (typeof customerId === "number") {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }
    }

    if (typeof shiftId === "number") {
      const shift = await tx.shift.findUnique({
        where: { id: shiftId },
      });

      if (!shift) {
        throw new Error("Shift not found");
      }
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products were not found");
    }

    for (const item of items) {
      if (item.quantity <= 0 || item.price < 0 || item.subtotal < 0) {
        throw new Error("Sale item values must be valid positive numbers");
      }

      const product = products.find((entry) => entry.id === item.productId);

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (
        user.role.name === "Cashier" &&
        restrictedCategoryIds.size > 0 &&
        !restrictedCategoryIds.has(product.categoryId)
      ) {
        throw new Error(`Cashier cannot sell ${product.name} from this category`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
    }

    const createdSale = await tx.sale.create({
      data: {
        receiptNumber: receiptNumber.trim(),
        subtotal,
        discountAmount,
        totalAmount,
        amountPaid,
        changeAmount,
        paymentMethod: normalizedPaymentMethod,
        customerId: typeof customerId === "number" ? customerId : null,
        userId,
        shiftId: typeof shiftId === "number" ? shiftId : null,
      },
    });

    await tx.saleItem.createMany({
      data: items.map((item) => ({
        saleId: createdSale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    });

    for (const item of items) {
      const product = products.find((entry) => entry.id === item.productId);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          type: "SALE",
          quantity: item.quantity,
          note: `Sold via receipt ${receiptNumber.trim()}${product ? ` - ${product.name}` : ""}`,
        },
      });
    }

    return tx.sale.findUnique({
      where: { id: createdSale.id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                barcode: true,
                costPrice: true,
                price: true,
                categoryId: true,
                createdAt: true,
                updatedAt: true,
                imageUrl: true,
                stock: true,
                unit: true,
                weight: true,
              },
            },
          },
        },
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
  });
}
