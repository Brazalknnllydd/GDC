import { prisma } from "../lib/prisma.js";
import {
  decrementCashierInventory,
  getCashierProductPrice,
  getCashierProductQuantity,
  incrementCashierInventory,
  isRecipientCashier,
  isSupplierCashier,
} from "./cashier-inventory.service.js";

const allowedPaymentMethods = new Set(["Cash", "GCash", "Utang"]);

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
  taxAmount?: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod?: string;
  paymentReference?: string | null;
  status?: string;
  approvedByUserId?: number | null;
  notes?: string | null;
  isPrinted?: boolean;
  customerId?: number | null;
  recipientUserId?: number | null;
  saleType?: string;
  userId: number;
  shiftId?: number | null;
  items: SaleItemInput[];
};

type SaleItemRow = SaleItemInput & {
  sourceCashierId?: number | null;
};

function splitSubtotal(subtotal: number, quantity: number, consumedQuantity: number, isLast: boolean, usedSubtotal: number) {
  if (isLast) {
    return subtotal - usedSubtotal;
  }

  return Number(((subtotal * consumedQuantity) / quantity).toFixed(2));
}

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
  taxAmount = 0,
  totalAmount,
  amountPaid,
  changeAmount,
  paymentMethod = "Cash",
  paymentReference,
  status = "completed",
  approvedByUserId,
  notes,
  isPrinted = false,
  customerId,
  recipientUserId,
  saleType = "CUSTOMER",
  userId,
  shiftId,
  items,
}: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    const normalizedPaymentMethod = paymentMethod.trim() || "Cash";

    if (!allowedPaymentMethods.has(normalizedPaymentMethod)) {
      throw new Error("Payment method must be Cash, GCash, or Utang");
    }

    const normalizedSaleType = saleType === "INTERNAL_CASHIER" ? "INTERNAL_CASHIER" : "CUSTOMER";

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

    const isCashierSale = user.role.name === "Cashier";

    let recipientUser: { id: number; name: string; username: string } | null = null;

    if (normalizedSaleType === "INTERNAL_CASHIER") {
      if (!isCashierSale || !isSupplierCashier(user.username)) {
        throw new Error("Only Cashier A and Cashier B can sell to cashier inventory");
      }

      if (normalizedPaymentMethod !== "Cash") {
        throw new Error("Cashier inventory sales must use Cash payment");
      }

      if (typeof recipientUserId !== "number") {
        throw new Error("Recipient cashier is required");
      }

      recipientUser = await tx.user.findUnique({
        where: { id: recipientUserId },
        select: {
          id: true,
          name: true,
          username: true,
        },
      });

      if (!recipientUser || !isRecipientCashier(recipientUser.username)) {
        throw new Error("Recipient must be Cashier C or Cashier D");
      }

      if (recipientUser.id === user.id) {
        throw new Error("Recipient cashier must be different from seller");
      }
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

    const validProductIds = [...new Set(items.map((item) => item.productId).filter((id): id is number => typeof id === "number"))];
    const products = await tx.product.findMany({
      where: {
        id: {
          in: validProductIds,
        },
      },
    });

    if (products.length !== validProductIds.length) {
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
        isCashierSale &&
        restrictedCategoryIds.size > 0 &&
        !restrictedCategoryIds.has(product.categoryId)
      ) {
        throw new Error(`Cashier cannot sell ${product.name} from this category`);
      }

      const availableStock = isCashierSale
        ? await getCashierProductQuantity(tx, user.id, item.productId)
        : product.stock;

      if (availableStock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      if (isCashierSale) {
        const overridePrice = await getCashierProductPrice(tx, user.id, item.productId);
        const expectedPrice = Number(overridePrice ?? product.price);
        const receivedPrice = Number(item.price);

        if (Math.round(receivedPrice * 100) !== Math.round(expectedPrice * 100)) {
          throw new Error(`Price has changed for ${product.name}. Please refresh and try again.`);
        }
      }
    }

    const createdSale = await tx.sale.create({
      data: {
        receiptNumber: receiptNumber.trim(),
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        amountPaid,
        changeAmount,
        paymentMethod: normalizedPaymentMethod,
        paymentReference: paymentReference ?? null,
        saleType: normalizedSaleType,
        recipientUserId: normalizedSaleType === "INTERNAL_CASHIER" ? recipientUser!.id : null,
        status,
        approvedByUserId: typeof approvedByUserId === "number" ? approvedByUserId : null,
        notes: notes ?? null,
        isPrinted,
        customerId: normalizedSaleType === "CUSTOMER" && typeof customerId === "number" ? customerId : null,
        userId,
        shiftId: typeof shiftId === "number" ? shiftId : null,
      },
    });

    const saleItemRows: SaleItemRow[] = [];

    for (const item of items) {
      const product = products.find((entry) => entry.id === item.productId);

      if (isCashierSale) {
        const consumedRows = await decrementCashierInventory(
          tx,
          user.id,
          item.productId,
          item.quantity
        );

        if (normalizedSaleType === "INTERNAL_CASHIER") {
          await incrementCashierInventory(
            tx,
            recipientUser!.id,
            item.productId,
            user.id,
            item.quantity
          );

          saleItemRows.push({
            ...item,
            sourceCashierId: user.id,
          });
          continue;
        }

        let usedSubtotal = 0;
        consumedRows.forEach((consumedRow, index) => {
          const subtotalPart = splitSubtotal(
            item.subtotal,
            item.quantity,
            consumedRow.quantity,
            index === consumedRows.length - 1,
            usedSubtotal
          );
          usedSubtotal += subtotalPart;
          saleItemRows.push({
            ...item,
            quantity: consumedRow.quantity,
            subtotal: subtotalPart,
            sourceCashierId: consumedRow.sourceCashierId,
          });
        });
      } else {
        saleItemRows.push(item);
      }

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
          note: `Sold via receipt ${receiptNumber.trim()} - ${product!.name}`,
        },
      });
    }

    await tx.saleItem.createMany({
      data: saleItemRows.map((item) => ({
        saleId: createdSale.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        sourceCashierId: item.sourceCashierId ?? null,
        subtotal: item.subtotal,
      })),
    });

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
        recipientUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
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

export async function voidSale(saleId: number, userId: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            role: true,
            username: true,
          },
        },
      },
    });

    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.status === "voided") {
      throw new Error("Sale is already voided");
    }

    const voidNotes = `[VOIDED] Reason: ${reason}`;
    const newNotes = sale.notes ? `${sale.notes}\n${voidNotes}` : voidNotes;

    const updatedSale = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: "voided",
        notes: newNotes,
      },
    });

    for (const item of sale.items) {
      if (!item.productId) continue;

      if (sale.saleType === "INTERNAL_CASHIER") {
        if (!sale.recipientUserId) {
          throw new Error("Internal sale recipient is missing");
        }

        await decrementCashierInventory(
          tx,
          sale.recipientUserId,
          item.productId,
          item.quantity,
          sale.userId
        );

        await incrementCashierInventory(
          tx,
          sale.userId,
          item.productId,
          sale.userId,
          item.quantity
        );

        continue;
      }

      if (sale.user.role.name === "Cashier") {
        await incrementCashierInventory(
          tx,
          sale.userId,
          item.productId,
          item.sourceCashierId ?? sale.userId,
          item.quantity
        );
      }
      
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          type: "VOID_RESTOCK",
          quantity: item.quantity,
          note: `Voided receipt ${sale.receiptNumber}`,
        },
      });
    }

    return updatedSale;
  });
}
