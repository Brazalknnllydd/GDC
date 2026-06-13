import { Router } from "express";

import { getInventoryLogs } from "../controllers/inventory-log.controller.js";

const router = Router();

router.get("/", getInventoryLogs);

export default router;
