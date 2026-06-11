import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getCategories = async (
  _req: Request,
  res: Response
) => {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  res.json(categories);
};

export const createCategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { name } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);

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
    const { name } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { name },
    });

    res.json(category);
  } catch (error) {
    console.error(error);

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

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete category",
    });
  }
};