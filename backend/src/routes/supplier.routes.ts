import { Router } from "express";
import {
  createSupplier,
  createSupplierPurchase,
  getSupplierPurchases,
  getSuppliers,
  updateSupplier,
  updateSupplierPurchase,
} from "../controllers/supplier.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireRole(["Admin", "Owner"]));

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.get("/purchases", getSupplierPurchases);
router.post("/purchases", createSupplierPurchase);
router.put("/purchases/:id", updateSupplierPurchase);
router.put("/:id", updateSupplier);

export default router;
