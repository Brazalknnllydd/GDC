import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getAuthenticatedCashierDashboardSummary } from "../controllers/cashier.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../types/express.js";

const router = Router();

router.get(
  "/dashboard/me",
  requireAuth,
  requireRole(["Admin", "Cashier"]),
  getAuthenticatedCashierDashboardSummary
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
