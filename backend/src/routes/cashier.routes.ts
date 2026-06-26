import { Router } from "express";

import { getCashierDashboardSummary } from "../controllers/cashier.controller.js";

const router = Router();

router.get("/dashboard/:userId", getCashierDashboardSummary);

export default router;
