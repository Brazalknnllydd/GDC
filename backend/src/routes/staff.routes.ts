import { Router } from "express";
import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

type CashierInput = {
  allowedCategoryIds?: unknown;
  name?: string;
  password?: string;
  username?: string;
};

function serializeCashier(cashier: {
  createdAt: Date;
  id: number;
  name: string;
  role: { name: string };
  username: string;
  cashierCategoryAccesses: Array<{
    category: {
      id: number;
      name: string;
    };
  }>;
}) {
  return {
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
  };
}

function parseCategoryIds(allowedCategoryIds: unknown) {
  return Array.isArray(allowedCategoryIds)
    ? [
        ...new Set(
          allowedCategoryIds
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0)
        ),
      ]
    : [];
}

function buildArchivedUsername(username: string, cashierId: number) {
  const normalizedUsername = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `archived-${normalizedUsername || "cashier"}-${cashierId}`;
}

router.get("/cashiers", requireAuth, requireRole(["Admin", "Owner"]), async (_req, res) => {
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

    res.json(cashiers.map(serializeCashier));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch cashiers",
    });
  }
});

router.post("/cashiers", requireAuth, requireRole(["Admin", "Owner"]), async (req, res) => {
  try {
    const { allowedCategoryIds, name, password, username } = req.body as CashierInput;

    const trimmedName = name?.trim() ?? "";
    const trimmedUsername = username?.trim() ?? "";
    const trimmedPassword = password?.trim() ?? "";
    const parsedCategoryIds = parseCategoryIds(allowedCategoryIds);

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

    res.status(201).json(serializeCashier(cashier));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create cashier",
    });
  }
});

router.put("/cashiers/:id", requireAuth, requireRole(["Admin", "Owner"]), async (req, res) => {
  try {
    const cashierId = Number(req.params.id);

    if (!Number.isInteger(cashierId) || cashierId <= 0) {
      return res.status(400).json({
        message: "Invalid cashier id",
      });
    }

    const { allowedCategoryIds, name, password, username } = req.body as CashierInput;
    const trimmedName = name?.trim() ?? "";
    const trimmedUsername = username?.trim() ?? "";
    const trimmedPassword = password?.trim() ?? "";
    const parsedCategoryIds = parseCategoryIds(allowedCategoryIds);

    if (!trimmedName || !trimmedUsername) {
      return res.status(400).json({
        message: "Name and username are required",
      });
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (parsedCategoryIds.length === 0) {
      return res.status(400).json({
        message: "Select at least one allowed category",
      });
    }

    const existingCashier = await prisma.user.findFirst({
      where: {
        id: cashierId,
        role: {
          name: "Cashier",
        },
      },
    });

    if (!existingCashier) {
      return res.status(404).json({
        message: "Cashier not found",
      });
    }

    const usernameOwner = await prisma.user.findUnique({
      where: {
        username: trimmedUsername,
      },
      select: {
        id: true,
      },
    });

    if (usernameOwner && usernameOwner.id !== cashierId) {
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

    const updatedCashier = await prisma.user.update({
      where: {
        id: cashierId,
      },
      data: {
        ...(trimmedPassword
          ? {
              password: await bcrypt.hash(trimmedPassword, 10),
            }
          : {}),
        cashierCategoryAccesses: {
          deleteMany: {},
          create: parsedCategoryIds.map((categoryId) => ({
            categoryId,
          })),
        },
        name: trimmedName,
        username: trimmedUsername,
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

    res.json(serializeCashier(updatedCashier));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update cashier",
    });
  }
});

router.delete("/cashiers/:id", requireAuth, requireRole(["Admin", "Owner"]), async (req, res) => {
  try {
    const cashierId = Number(req.params.id);

    if (!Number.isInteger(cashierId) || cashierId <= 0) {
      return res.status(400).json({
        message: "Invalid cashier id",
      });
    }

    const cashier = await prisma.user.findFirst({
      where: {
        id: cashierId,
        role: {
          name: "Cashier",
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            sales: true,
            shifts: true,
          },
        },
      },
    });

    if (!cashier) {
      return res.status(404).json({
        message: "Cashier not found",
      });
    }

    const hasLinkedRecords = cashier._count.sales > 0 || cashier._count.shifts > 0;

    if (!hasLinkedRecords) {
      try {
        await prisma.user.delete({
          where: {
            id: cashierId,
          },
        });

        return res.status(204).send();
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2003") {
          throw error;
        }
      }
    }

    const archivedRole = await prisma.role.upsert({
      where: {
        name: "Archived",
      },
      update: {},
      create: {
        name: "Archived",
      },
    });

    await prisma.user.update({
      where: {
        id: cashierId,
      },
      data: {
        cashierCategoryAccesses: {
          deleteMany: {},
        },
        roleId: archivedRole.id,
        username: buildArchivedUsername(cashier.name, cashier.id),
      },
    });

    return res.status(200).json({
      message: "Cashier archived successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete cashier",
    });
  }
});

export default router;
