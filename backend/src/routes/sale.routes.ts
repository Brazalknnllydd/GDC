import { Router } from "express";

import {
  createSale,
  getSaleById,
  getSales,
} from "../controllers/sale.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getSales);
router.get("/:id", requireAuth, getSaleById);
router.post("/", requireAuth, requireRole(["Admin", "Cashier"]), createSale);

export default router;
