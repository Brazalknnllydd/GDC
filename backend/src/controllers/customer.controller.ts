import type { Request, Response } from "express";
import { CustomerService } from "../services/customer.service.js";

export const getCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 15);
    const skip = (page - 1) * limit;

    const { total, data } = await CustomerService.getCustomersPaginated(search, skip, limit);

    res.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
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

    const customer = await CustomerService.createCustomer({
      name: name.trim(),
      phoneNumber: phoneNumber?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
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

    const customer = await CustomerService.updateCustomer(id, {
      name: name.trim(),
      phoneNumber: phoneNumber?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
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

    await CustomerService.deleteCustomer(id);

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
