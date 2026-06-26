import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getCustomers = async (
  _req: Request,
  res: Response
) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(customers);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch customers",
    });
  }
};

export const createCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      name,
      phoneNumber,
      address,
      notes,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(customer);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create customer",
    });
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      phoneNumber,
      address,
      notes,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        message: "Customer name is required",
      });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.json(customer);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    await prisma.customer.delete({
      where: { id },
    });

    res.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete customer",
    });
  }
};
