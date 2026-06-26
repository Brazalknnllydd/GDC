import { Router } from "express";

import {
  createSale,
  getSaleById,
  getSales,
} from "../controllers/sale.controller.js";

const router = Router();

router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", createSale);

export default router;
