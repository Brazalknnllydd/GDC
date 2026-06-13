import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const createProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      barcode,
      costPrice,
      price,
      stock,
      weight,
      unit,
      categoryId,
    } = req.body;

    const trimmedName = String(name ?? "").trim();
    const trimmedBarcode = String(barcode ?? "").trim() || null;
    const trimmedUnit = String(unit ?? "pcs").trim() || "pcs";
    const parsedPrice = Number(price);
    const parsedCostPrice = Number(costPrice);
    const parsedStock = Number(stock);
    const parsedCategoryId = Number(categoryId);
    const parsedWeight = weight === null || weight === undefined || weight === "" ? null : Number(weight);

    if (!trimmedName || Number.isNaN(parsedPrice) || Number.isNaN(parsedCostPrice) || Number.isNaN(parsedStock) || Number.isNaN(parsedCategoryId)) {
      return res.status(400).json({
        message: "Missing or invalid product fields",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: trimmedName,
        barcode: trimmedBarcode,
        costPrice: parsedCostPrice,
        price: parsedPrice,
        stock: parsedStock,
        unit: trimmedUnit,
        categoryId: parsedCategoryId,
        weight: parsedWeight,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);

    if ((error as { code?: string }).code === "P2002") {
      return res.status(409).json({
        message: "A product with that barcode already exists",
      });
    }

    if ((error as { code?: string }).code === "P2003") {
      return res.status(400).json({
        message: "Selected category does not exist",
      });
    }

    res.status(500).json({
      message: "Failed to create product",
    });
  }
};

export const getProducts = async (
  _req: Request,
  res: Response
) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

export const getProductById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

export const getProductByBarcode = async (
  req: Request,
  res: Response
) => {
  try {
    const rawBarcode = req.params.barcode;
    const barcode = Array.isArray(rawBarcode) ? rawBarcode[0] : rawBarcode;

    if (!barcode) {
      return res.status(400).json({ message: "Barcode is required" });
    }

    const product = await prisma.product.findUnique({
      where: {
        barcode,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Product id is required",
      });
    }

    const data: Record<string, unknown> = {};

    if (req.body.name !== undefined) {
      const trimmedName = String(req.body.name).trim();
      if (!trimmedName) {
        return res.status(400).json({
          message: "Product name is required",
        });
      }
      data.name = trimmedName;
    }

    if (req.body.barcode !== undefined) {
      data.barcode = String(req.body.barcode).trim() || null;
    }

    if (req.body.price !== undefined) {
      const parsedPrice = Number(req.body.price);
      if (Number.isNaN(parsedPrice)) {
        return res.status(400).json({
          message: "Price must be a valid number",
        });
      }
      data.price = parsedPrice;
    }

    if (req.body.costPrice !== undefined) {
      const parsedCostPrice = Number(req.body.costPrice);
      if (Number.isNaN(parsedCostPrice)) {
        return res.status(400).json({
          message: "Cost price must be a valid number",
        });
      }
      data.costPrice = parsedCostPrice;
    }

    if (req.body.stock !== undefined) {
      const parsedStock = Number(req.body.stock);
      if (Number.isNaN(parsedStock)) {
        return res.status(400).json({
          message: "Stock must be a valid number",
        });
      }
      data.stock = parsedStock;
    }

    if (req.body.unit !== undefined) {
      data.unit = String(req.body.unit).trim() || "pcs";
    }

    if (req.body.categoryId !== undefined) {
      const parsedCategoryId = Number(req.body.categoryId);
      if (Number.isNaN(parsedCategoryId)) {
        return res.status(400).json({
          message: "Category is required",
        });
      }
      data.categoryId = parsedCategoryId;
    }

    if (req.body.weight !== undefined) {
      data.weight =
        req.body.weight === null || req.body.weight === ""
          ? null
          : Number(req.body.weight);
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });

    res.json(product);
  } catch (error) {
    console.error(error);

    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if ((error as { code?: string }).code === "P2002") {
      return res.status(409).json({
        message: "A product with that barcode already exists",
      });
    }

    if ((error as { code?: string }).code === "P2003") {
      return res.status(400).json({
        message: "Selected category does not exist",
      });
    }

    res.status(500).json({
      message: "Failed to update product",
    });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Product id is required",
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};
