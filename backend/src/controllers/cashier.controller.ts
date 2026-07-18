import type { Request, Response } from "express";

import { getCashierDashboard } from "../services/cashier-dashboard.service.js";
import type { AuthenticatedRequest } from "../types/express.js";

export async function getAuthenticatedCashierDashboardSummary(
  req: Request,
  res: Response
) {
  try {
    const authReq = req as AuthenticatedRequest;
    const dashboard = await getCashierDashboard(authReq.authUser.id);

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
