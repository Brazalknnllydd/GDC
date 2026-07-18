import { Router } from "express";

import { getAuthenticatedCashierDashboardSummary } from "../controllers/cashier.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get(
  "/dashboard/me",
  requireAuth,
  requireRole(["Admin", "Cashier"]),
  getAuthenticatedCashierDashboardSummary
);

export default router;
