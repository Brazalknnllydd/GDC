import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getInventoryLogs = async (
  _req: Request,
  res: Response
) => {
  try {
    const logs = await prisma.inventoryLog.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(logs);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch inventory logs",
    });
  }
};
