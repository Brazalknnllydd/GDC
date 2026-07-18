import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/cashiers", requireAuth, requireRole(["Admin"]), async (_req, res) => {
  try {
    const cashiers = await prisma.user.findMany({
      where: {
        role: {
          name: "Cashier",
        },
      },
      include: {
        cashierCategoryAccesses: {
          include: {
            category: true,
          },
        },
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(
      cashiers.map((cashier) => ({
        createdAt: cashier.createdAt,
        id: cashier.id,
        name: cashier.name,
        role: cashier.role.name,
        username: cashier.username,
        allowedCategories: cashier.cashierCategoryAccesses
          .map((entry) => ({
            id: entry.category.id,
            name: entry.category.name,
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      }))
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch cashiers",
    });
  }
});

router.post("/cashiers", requireAuth, requireRole(["Admin"]), async (req, res) => {
  try {
    const {
      allowedCategoryIds,
      name,
      password,
      username,
    } = req.body as {
      allowedCategoryIds?: unknown;
      name?: string;
      password?: string;
      username?: string;
    };

    const trimmedName = name?.trim() ?? "";
    const trimmedUsername = username?.trim() ?? "";
    const trimmedPassword = password?.trim() ?? "";
    const parsedCategoryIds = Array.isArray(allowedCategoryIds)
      ? [...new Set(allowedCategoryIds.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))]
      : [];

    if (!trimmedName || !trimmedUsername || !trimmedPassword) {
      return res.status(400).json({
        message: "Name, username, and password are required",
      });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (parsedCategoryIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one allowed category",
      });
    }

    const cashierRole = await prisma.role.findUnique({
      where: {
        name: "Cashier",
      },
    });

    if (!cashierRole) {
      return res.status(500).json({
        message: "Cashier role is not configured",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        username: trimmedUsername,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: parsedCategoryIds,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (categories.length !== parsedCategoryIds.length) {
      return res.status(400).json({
        message: "One or more selected categories were not found",
      });
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    const cashier = await prisma.user.create({
      data: {
        name: trimmedName,
        password: hashedPassword,
        roleId: cashierRole.id,
        username: trimmedUsername,
        cashierCategoryAccesses: {
          create: parsedCategoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
      },
      include: {
        cashierCategoryAccesses: {
          include: {
            category: true,
          },
        },
        role: true,
      },
    });

    res.status(201).json({
      createdAt: cashier.createdAt,
      id: cashier.id,
      name: cashier.name,
      role: cashier.role.name,
      username: cashier.username,
      allowedCategories: cashier.cashierCategoryAccesses
        .map((entry) => ({
          id: entry.category.id,
          name: entry.category.name,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create cashier",
    });
  }
});

export default router;
