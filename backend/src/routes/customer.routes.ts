import { Router } from "express";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../controllers/customer.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole(["Admin", "Cashier"]), getCustomers);
router.post("/", requireAuth, requireRole(["Admin", "Cashier"]), createCustomer);
router.put("/:id", requireAuth, requireRole(["Admin", "Cashier"]), updateCustomer);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteCustomer);

export default router;
