import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  id: number;
  role: string;
};

function getBearerToken(headerValue?: string) {
  if (!headerValue) {
    return null;
  }

  const [scheme, token] = headerValue.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    return res.status(401).json({
      message: "Authentication is required",
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      message: "JWT secret is not configured",
    });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    req.authUser = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired authentication token",
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  const normalizedRoles = new Set(allowedRoles.map((role) => role.toLowerCase()));

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({
        message: "Authentication is required",
      });
    }

    if (!normalizedRoles.has(req.authUser.role.toLowerCase())) {
      return res.status(403).json({
        message: "You do not have access to this resource",
      });
    }

    next();
  };
}
