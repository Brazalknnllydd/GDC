import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  createSaleWithInventoryUpdate,
  isValidSaleItem,
  voidSale,
} from "../services/sale.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

const allowedPaymentMethods = new Set(["Cash", "GCash", "Utang"]);

export const getSales = async (
  req: Request,
  res: Response
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const isAdmin = authReq.authUser.role.toLowerCase() === "admin";
    const sales = await prisma.sale.findMany({
      ...(isAdmin
        ? {}
        : {
            where: {
              userId: authReq.authUser.id,
            },
          }),
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
    const authReq = req as AuthenticatedRequest;
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

    const isAdmin = authReq.authUser.role.toLowerCase() === "admin";

    if (!isAdmin && sale.user.id !== authReq.authUser.id) {
      return res.status(403).json({
        message: "Cashiers can only access their own sales",
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
    const authReq = req as AuthenticatedRequest;
    const isAdmin = authReq.authUser.role.toLowerCase() === "admin";
    const {
      receiptNumber,
      subtotal,
      discountAmount = 0,
      taxAmount = 0,
      totalAmount,
      amountPaid,
      changeAmount,
      paymentMethod = "Cash",
      paymentReference,
      status,
      approvedByUserId,
      notes,
      isPrinted,
      customerId,
      userId: requestedUserId,
      shiftId,
      items,
    } = req.body as {
      receiptNumber?: string;
      subtotal?: number;
      discountAmount?: number;
      taxAmount?: number;
      totalAmount?: number;
      amountPaid?: number;
      changeAmount?: number;
      paymentMethod?: string;
      paymentReference?: string | null;
      status?: string;
      approvedByUserId?: number | null;
      notes?: string | null;
      isPrinted?: boolean;
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

    const saleUserId = isAdmin
      ? requestedUserId ?? authReq.authUser.id
      : authReq.authUser.id;

    if (typeof saleUserId !== "number") {
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
        message: "Payment method must be Cash, GCash, or Utang",
      });
    }


    if (!Array.isArray(items) || items.length === 0 || !items.every(isValidSaleItem)) {
      return res.status(400).json({
        message: "At least one valid sale item is required",
      });
    }

    let finalShiftId = shiftId;
    if (!isAdmin && !finalShiftId) {
      const activeShift = await prisma.shift.findFirst({
        where: { userId: saleUserId, status: 'OPEN' },
      });
      if (!activeShift) {
        return res.status(403).json({
          message: "You must have an open shift to process sales.",
        });
      }
      finalShiftId = activeShift.id;
    }

    const saleInput = {
      receiptNumber,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      amountPaid,
      changeAmount,
      paymentMethod,
      userId: saleUserId,
      items,
      ...(paymentReference !== undefined ? { paymentReference } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(approvedByUserId !== undefined ? { approvedByUserId } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(isPrinted !== undefined ? { isPrinted } : {}),
      ...(customerId !== undefined ? { customerId } : {}),
      ...(finalShiftId !== undefined && finalShiftId !== null ? { shiftId: finalShiftId } : {}),
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

export const markSaleAsPaid = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = Number(req.params.id);

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    if (sale.status !== "pending") {
      return res.status(400).json({ message: "Only pending sales can be marked as paid" });
    }

    const isAdmin = authReq.authUser.role.toLowerCase() === "admin";
    if (!isAdmin && sale.userId !== authReq.authUser.id) {
      return res.status(403).json({ message: "Cashiers can only update their own sales" });
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        status: "completed",
        amountPaid: sale.totalAmount,
        changeAmount: 0,
      },
    });

    res.json(updatedSale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark sale as paid" });
  }
};

export const voidSaleController = async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const id = Number(req.params.id);
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({ message: "A void reason is required" });
    }

    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const isAdmin = authReq.authUser.role.toLowerCase() === "admin";
    if (!isAdmin && sale.userId !== authReq.authUser.id) {
      return res.status(403).json({ message: "Cashiers can only void their own sales" });
    }

    const voidedSale = await voidSale(id, authReq.authUser.id, reason);
    res.json(voidedSale);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to void sale";
    res.status(400).json({ message });
  }
};
