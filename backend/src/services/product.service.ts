import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { applySupplierCashierStockDelta } from "./cashier-inventory.service.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsRootDir = path.resolve(currentDir, "../../uploads");

export function getImageUrlFromFile(file?: Express.Multer.File) {
  if (!file) {
    return undefined;
  }
  return `/uploads/products/${file.filename}`;
}

export async function removeStoredImage(imageUrl?: string | null) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
    return;
  }
  const relativePath = imageUrl.replace(/^\/uploads[\\/]/, "");
  const absolutePath = path.resolve(uploadsRootDir, relativePath);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(error);
    }
  }
}

export const ProductService = {
  async createProduct(data: Prisma.ProductUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data,
        include: { category: true },
      });

      await applySupplierCashierStockDelta(tx, product.id, Number(data.stock ?? 0));

      return product;
    });
  },

  async getProducts() {
    return await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getProductById(id: number) {
    return await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  async getProductByBarcode(barcode: string) {
    return await prisma.product.findUnique({
      where: { barcode },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async updateProduct(id: number, data: Prisma.ProductUncheckedUpdateInput) {
    return prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUniqueOrThrow({
        where: { id },
        select: { stock: true },
      });
      const nextStock = data.stock === undefined ? existingProduct.stock : Number(data.stock);

      if (Number.isNaN(nextStock)) {
        throw new Error("Stock must be a valid number");
      }

      const product = await tx.product.update({
        where: { id },
        data,
        include: { category: true },
      });

      await applySupplierCashierStockDelta(tx, product.id, nextStock - existingProduct.stock);

      return product;
    });
  },

  async deleteProduct(id: number) {
    return await prisma.product.delete({
      where: { id },
    });
  },
};
