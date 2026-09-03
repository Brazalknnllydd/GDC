import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getAuthenticatedCashierDashboardSummary } from "../controllers/cashier.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  getCashierInventoryRows,
  setRecipientCashierProductPrice,
} from "../services/cashier-inventory.service.js";
import {
  createCashierExpense,
  getCashierExpenses,
  getCashierReportSummary,
} from "../services/cashier-expense.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

const router = Router();

router.get(
  "/dashboard/me",
  requireAuth,
  requireRole(["Admin", "Cashier"]),
  getAuthenticatedCashierDashboardSummary
);

router.get(
  "/expenses",
  requireAuth,
  requireRole(["Admin", "Cashier"]),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const shiftId = req.query.shiftId ? Number(req.query.shiftId) : undefined;

      if (shiftId !== undefined && (!Number.isInteger(shiftId) || shiftId <= 0)) {
        return res.status(400).json({ message: "Invalid shift id" });
      }

      res.json(await getCashierExpenses(prisma, authReq.authUser.id, shiftId));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch cashier expenses" });
    }
  }
);

router.post(
  "/expenses",
  requireAuth,
  requireRole(["Admin", "Cashier"]),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const amount = Number(req.body.amount);
      const description = typeof req.body.description === "string" ? req.body.description : "";
      const expenseDate = req.body.expenseDate ? new Date(req.body.expenseDate) : new Date();
      const shiftId = req.body.shiftId === undefined || req.body.shiftId === null
        ? undefined
        : Number(req.body.shiftId);

      if (Number.isNaN(expenseDate.getTime())) {
        return res.status(400).json({ message: "Invalid expense date" });
      }

      if (shiftId !== undefined && (!Number.isInteger(shiftId) || shiftId <= 0)) {
        return res.status(400).json({ message: "Invalid shift id" });
      }

      const expense = await createCashierExpense(
        prisma,
        authReq.authUser.id,
        amount,
        description,
        expenseDate,
        shiftId
      );

      res.status(201).json(expense);
    } catch (error) {
      console.error(error);

      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to record cashier expense",
      });
    }
  }
);

router.get(
  "/reports/summary",
  requireAuth,
  requireRole(["Admin", "Owner"]),
  async (req, res) => {
    try {
      const startDate = typeof req.query.startDate === "string" ? new Date(req.query.startDate) : undefined;
      const endDate = typeof req.query.endDate === "string" ? new Date(req.query.endDate) : undefined;

      if (startDate && Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ message: "Invalid start date" });
      }

      if (endDate && Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid end date" });
      }

      res.json(await getCashierReportSummary(prisma, { endDate, startDate }));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch cashier report summary" });
    }
  }
);

router.get(
  "/inventory",
  requireAuth,
  requireRole(["Admin", "Owner"]),
  async (_req, res) => {
    try {
      res.json(await getCashierInventoryRows(prisma));
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Failed to fetch cashier inventory",
      });
    }
  }
);

router.put(
  "/inventory/prices",
  requireAuth,
  requireRole(["Admin", "Owner"]),
  async (req, res) => {
    try {
      const cashierId = Number(req.body.cashierId);
      const productId = Number(req.body.productId);
      const price = req.body.price === null || req.body.price === ""
        ? null
        : Number(req.body.price);

      if (!Number.isInteger(cashierId) || cashierId <= 0) {
        return res.status(400).json({ message: "Invalid cashier id" });
      }

      if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        return res.status(400).json({ message: "Price must be a valid non-negative number" });
      }

      res.json(await setRecipientCashierProductPrice(prisma, cashierId, productId, price));
    } catch (error) {
      console.error(error);

      const message =
        error instanceof Error ? error.message : "Failed to update cashier product price";
      const statusCode =
        message.includes("only allowed") || message.includes("not found") || message.includes("valid")
          ? 400
          : 500;

      res.status(statusCode).json({ message });
    }
  }
);

router.put(
  "/shift/opening-cash",
  requireAuth,
  requireRole(["Admin", "Cashier"]),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.authUser.id;
      const { openingCash } = req.body as { openingCash: number | string };

      const parsedOpeningCash = Number(openingCash);
      if (isNaN(parsedOpeningCash) || parsedOpeningCash < 0) {
        return res.status(400).json({ message: "Invalid opening cash amount" });
      }

      // Check if there is an active shift
      let activeShift = await prisma.shift.findFirst({
        where: {
          userId,
          endedAt: null,
        },
      });

      if (activeShift) {
        // Update existing active shift
        activeShift = await prisma.shift.update({
          where: { id: activeShift.id },
          data: { openingCash: parsedOpeningCash },
        });
      } else {
        // Create new active shift
        activeShift = await prisma.shift.create({
          data: {
            userId,
            openingCash: parsedOpeningCash,
            startedAt: new Date(),
          },
        });
      }

      res.json({
        message: "Opening cash updated successfully",
        shift: activeShift,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to update opening cash" });
    }
  }
);

export default router;
