import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createSaleWithInventoryUpdate,
  isValidSaleItem,
} from "../services/sale.service.js";

const allowedPaymentMethods = new Set(["Cash", "GCash"]);

export const getSales = async (
  _req: Request,
  res: Response
) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                costPrice: true,
                id: true,
                name: true,
                barcode: true,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(sales);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch sales",
    });
  }
};

export const getSaleById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const sale = await prisma.sale.findUnique({
      where: { id },
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

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.json(sale);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch sale",
    });
  }
};

export const createSale = async (
  req: Request,
  res: Response
) => {
  try {
    const {
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
    } = req.body as {
      receiptNumber?: string;
      subtotal?: number;
      discountAmount?: number;
      totalAmount?: number;
      amountPaid?: number;
      changeAmount?: number;
      paymentMethod?: string;
      customerId?: number | null;
      userId?: number;
      shiftId?: number | null;
      items?: unknown[];
    };

    if (!receiptNumber?.trim()) {
      return res.status(400).json({
        message: "Receipt number is required",
      });
    }

    if (typeof userId !== "number") {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (
      typeof subtotal !== "number" ||
      typeof totalAmount !== "number" ||
      typeof amountPaid !== "number" ||
      typeof changeAmount !== "number"
    ) {
      return res.status(400).json({
        message: "Sale amounts are required",
      });
    }

    if (
      typeof paymentMethod !== "string" ||
      !allowedPaymentMethods.has(paymentMethod.trim())
    ) {
      return res.status(400).json({
        message: "Payment method must be Cash or GCash",
      });
    }

    if (!Array.isArray(items) || items.length === 0 || !items.every(isValidSaleItem)) {
      return res.status(400).json({
        message: "At least one valid sale item is required",
      });
    }

    const saleInput = {
      receiptNumber,
      subtotal,
      discountAmount,
      totalAmount,
      amountPaid,
      changeAmount,
      paymentMethod,
      userId,
      items,
      ...(customerId !== undefined ? { customerId } : {}),
      ...(shiftId !== undefined ? { shiftId } : {}),
    };

    const sale = await createSaleWithInventoryUpdate(saleInput);

    res.status(201).json(sale);
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Failed to create sale";

    const statusCode =
      message.includes("not found") ||
      message.includes("Insufficient stock") ||
      message.includes("valid positive numbers")
        ? 400
        : 500;

    res.status(statusCode).json({
      message,
    });
  }
};
