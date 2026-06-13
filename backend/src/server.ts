import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import categoryRoutes from "./routes/category.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import saleRoutes from "./routes/sale.routes.js";
import inventoryLogRoutes from "./routes/inventory-log.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/customers", customerRoutes);
app.use("/sales", saleRoutes);
app.use("/inventory-logs", inventoryLogRoutes);

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
