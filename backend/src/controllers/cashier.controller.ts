import type { Request, Response } from "express";

import { getCashierDashboard } from "../services/cashier-dashboard.service.js";

export async function getCashierDashboardSummary(req: Request, res: Response) {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: "A valid user ID is required",
      });
    }

    const dashboard = await getCashierDashboard(userId);

    res.json(dashboard);
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch cashier dashboard";
    const statusCode = message === "User not found" ? 404 : 500;

    res.status(statusCode).json({
      message,
    });
  }
}
