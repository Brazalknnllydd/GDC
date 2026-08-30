import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import categoryRoutes from "./routes/category.routes.js";
import authRoutes from "./routes/auth.routes.js";
import cashierRoutes from "./routes/cashier.routes.js";
import productRoutes from "./routes/product.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import inventoryLogRoutes from "./routes/inventory-log.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import chatbotRoutes from "./routes/chatbot.routes.js";
import shiftRoutes from "./routes/shift.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, "../uploads");

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ],
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/customers", customerRoutes);
app.use("/cashier", cashierRoutes);
app.use("/sales", saleRoutes);
app.use("/inventory-logs", inventoryLogRoutes);
app.use("/staff", staffRoutes);
app.use("/chatbot", chatbotRoutes);
app.use("/shifts", shiftRoutes);
app.use("/suppliers", supplierRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "GDC POS API Running",
  });
});

app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
