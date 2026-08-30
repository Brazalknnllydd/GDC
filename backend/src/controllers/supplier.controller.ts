import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { SupplierService } from "../services/supplier.service.js";

type SupplierBody = {
  name?: unknown;
  notes?: unknown;
  phone?: unknown;
};

type PurchaseItemBody = {
  id?: unknown;
  newProduct?: {
    barcode?: unknown;
    categoryId?: unknown;
    costPrice?: unknown;
    description?: unknown;
    name?: unknown;
    salePrice?: unknown;
    unit?: unknown;
    weight?: unknown;
  };
  productId?: unknown;
  quantity?: unknown;
  salePrice?: unknown;
  unitCost?: unknown;
};

type PurchaseBody = {
  chequeCreditDate?: unknown;
  items?: unknown;
  notes?: unknown;
  purchaseDate?: unknown;
  referenceNumber?: unknown;
  supplierId?: unknown;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown) {
  const text = asTrimmedString(value);
  return text || null;
}

function asPositiveNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function asNonNegativeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function asPositiveInteger(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function asDate(value: unknown) {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSupplierBody(body: SupplierBody) {
  const name = asTrimmedString(body.name);

  if (!name) {
    throw new Error("Supplier name is required");
  }

  return {
    name,
    notes: asNullableString(body.notes),
    phone: asNullableString(body.phone),
  };
}

function parsePurchaseItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Add at least one purchased product");
  }

  return value.map((rawItem, index) => {
    const item = rawItem as PurchaseItemBody;
    const id = item.id === undefined || item.id === null ? null : asPositiveInteger(item.id);
    const productId =
      item.productId === undefined || item.productId === null
        ? undefined
        : asPositiveInteger(item.productId);
    const quantity = asPositiveNumber(item.quantity);
    const unitCost = asNonNegativeNumber(item.unitCost);
    const salePrice = asNonNegativeNumber(item.salePrice);

    if (item.id !== undefined && item.id !== null && !id) {
      throw new Error(`Purchase item ${index + 1} has an invalid id`);
    }

    if (!quantity || unitCost === null || salePrice === null) {
      throw new Error(`Purchase item ${index + 1} has invalid quantity or prices`);
    }

    if (productId) {
      return {
        ...(id ? { id } : {}),
        productId,
        quantity,
        salePrice,
        unitCost,
      };
    }

    const newProduct = item.newProduct;
    const name = asTrimmedString(newProduct?.name);
    const categoryId = asPositiveInteger(newProduct?.categoryId);
    const weight =
      newProduct?.weight === undefined || newProduct?.weight === null || newProduct?.weight === ""
        ? null
        : asNonNegativeNumber(newProduct.weight);

    if (!name || !categoryId) {
      throw new Error(`New product details are required for item ${index + 1}`);
    }

    if (weight === null && newProduct?.weight !== undefined && newProduct.weight !== null && newProduct.weight !== "") {
      throw new Error(`New product weight is invalid for item ${index + 1}`);
    }

    return {
      ...(id ? { id } : {}),
      newProduct: {
        barcode: asNullableString(newProduct?.barcode),
        categoryId,
        costPrice: unitCost,
        description: asNullableString(newProduct?.description),
        name,
        salePrice,
        unit: asTrimmedString(newProduct?.unit) || "pcs",
        weight,
      },
      quantity,
      salePrice,
      unitCost,
    };
  });
}

function parsePurchaseBody(body: PurchaseBody) {
  const supplierId = asPositiveInteger(body.supplierId);
  const purchaseDate = asDate(body.purchaseDate);
  const chequeCreditDate = asDate(body.chequeCreditDate);

  if (!supplierId) {
    throw new Error("Supplier is required");
  }

  if (!purchaseDate) {
    throw new Error("Purchase date is required");
  }

  if (!chequeCreditDate) {
    throw new Error("Cheque credit date is required");
  }

  return {
    chequeCreditDate,
    items: parsePurchaseItems(body.items),
    notes: asNullableString(body.notes),
    purchaseDate,
    referenceNumber: asNullableString(body.referenceNumber),
    supplierId,
  };
}

function handleSupplierError(error: unknown, res: Response, fallbackMessage: string) {
  console.error(error);

  if (error instanceof Error) {
    const badRequestMessages = [
      "Add at least one purchased product",
      "Cheque credit date is required",
      "Each purchase item needs a product",
      "Existing purchase items cannot change products",
      "New product details are required",
      "Not enough stock",
      "One or more selected products were not found",
      "Purchase date is required",
      "Purchase item",
      "Selected category does not exist",
      "Supplier is required",
      "Supplier name is required",
      "Supplier purchase was not found",
      "Supplier was not found",
    ];

    if (badRequestMessages.some((message) => error.message.startsWith(message))) {
      return res.status(error.message.includes("not found") ? 404 : 400).json({
        message: error.message,
      });
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Supplier or product barcode already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Record not found",
      });
    }
  }

  return res.status(500).json({
    message: fallbackMessage,
  });
}

export async function getSuppliers(_req: Request, res: Response) {
  try {
    res.json(await SupplierService.getSuppliers());
  } catch (error) {
    handleSupplierError(error, res, "Failed to fetch suppliers");
  }
}

export async function createSupplier(req: Request, res: Response) {
  try {
    const supplier = await SupplierService.createSupplier(parseSupplierBody(req.body));
    res.status(201).json(supplier);
  } catch (error) {
    handleSupplierError(error, res, "Failed to create supplier");
  }
}

export async function updateSupplier(req: Request, res: Response) {
  try {
    const id = asPositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Supplier id is required",
      });
    }

    res.json(await SupplierService.updateSupplier(id, parseSupplierBody(req.body)));
  } catch (error) {
    handleSupplierError(error, res, "Failed to update supplier");
  }
}

export async function getSupplierPurchases(_req: Request, res: Response) {
  try {
    res.json(await SupplierService.getPurchases());
  } catch (error) {
    handleSupplierError(error, res, "Failed to fetch supplier purchases");
  }
}

export async function createSupplierPurchase(req: Request, res: Response) {
  try {
    const purchase = await SupplierService.createPurchase(parsePurchaseBody(req.body));
    res.status(201).json(purchase);
  } catch (error) {
    handleSupplierError(error, res, "Failed to create supplier purchase");
  }
}

export async function updateSupplierPurchase(req: Request, res: Response) {
  try {
    const id = asPositiveInteger(req.params.id);

    if (!id) {
      return res.status(400).json({
        message: "Supplier purchase id is required",
      });
    }

    res.json(await SupplierService.updatePurchase(id, parsePurchaseBody(req.body)));
  } catch (error) {
    handleSupplierError(error, res, "Failed to update supplier purchase");
  }
}
