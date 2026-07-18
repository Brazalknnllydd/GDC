import { Router } from "express";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole(["Admin", "Cashier"]), getCategories);
router.post("/", requireAuth, requireRole(["Admin"]), createCategory);
router.put("/:id", requireAuth, requireRole(["Admin"]), updateCategory);
router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteCategory);

export default router;
