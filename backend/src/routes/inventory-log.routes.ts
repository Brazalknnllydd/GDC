import { Router } from "express";

import { getInventoryLogs } from "../controllers/inventory-log.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole(["Admin"]), getInventoryLogs);

export default router;
