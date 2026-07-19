import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { productImageUpload } from "../middleware/product-image-upload.js";

const router = Router();

router.get("/", requireAuth, requireRole(["Admin", "Cashier"]), getProducts);
router.get("/barcode/:barcode", requireAuth, requireRole(["Admin", "Cashier"]), getProductByBarcode);
router.get("/:id", requireAuth, requireRole(["Admin", "Cashier"]), getProductById);

router.post("/", requireAuth, requireRole(["Admin"]), productImageUpload.single("image"), createProduct);

router.put("/:id", requireAuth, requireRole(["Admin"]), productImageUpload.single("image"), updateProduct);

router.delete("/:id", requireAuth, requireRole(["Admin"]), deleteProduct);

export default router;
