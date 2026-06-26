import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getCategories = async (
  _req: Request,
  res: Response
) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json(categories);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};

export const createCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const description = String(req.body?.description ?? "").trim() || null;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);

    if ((error as { code?: string }).code === "P2002") {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create category",
    });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body?.name ?? "").trim();
    const description = String(req.body?.description ?? "").trim() || null;

    if (!id) {
      return res.status(400).json({
        message: "Category id is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { description, name },
    });

    res.json(category);
  } catch (error) {
    console.error(error);

    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if ((error as { code?: string }).code === "P2002") {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    res.status(500).json({
      message: "Failed to update category",
    });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Category id is required",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if ((error as { code?: string }).code === "P2025") {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    if ((error as { code?: string }).code === "P2003") {
      return res.status(409).json({
        message: "Category cannot be deleted while products still use it",
      });
    }

    res.status(500).json({
      message: "Failed to delete category",
    });
  }
};
