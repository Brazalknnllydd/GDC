import { Router } from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  getProductByBarcode,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { productImageUpload } from "../middleware/product-image-upload.js";

const router = Router();

router.get("/", getProducts);
router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", getProductById);

router.post("/", productImageUpload.single("image"), createProduct);

router.put("/:id", productImageUpload.single("image"), updateProduct);

router.delete("/:id", deleteProduct);

export default router;
