import { Router } from "express";

import {
  createSale,
  getSaleById,
  getSales,
  markSaleAsPaid,
  voidSaleController,
} from "../controllers/sale.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getSales);
router.get("/:id", requireAuth, getSaleById);
router.post("/", requireAuth, requireRole(["Admin", "Cashier"]), createSale);
router.patch("/:id/pay", requireAuth, requireRole(["Admin", "Cashier"]), markSaleAsPaid);
router.put("/:id/void", requireAuth, requireRole(["Admin", "Cashier"]), voidSaleController);

export default router;
