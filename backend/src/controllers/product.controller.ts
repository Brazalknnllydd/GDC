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
      unit,
      categoryId,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        costPrice,
        price,
        stock,
        unit,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);

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

    const product = await prisma.product.update({
      where: { id },
      data: req.body,
    });

    res.json(product);
  } catch (error) {
    console.error(error);

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

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete product",
    });
  }
};
