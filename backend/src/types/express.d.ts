import type { Request } from "express";

export type AuthenticatedUser = {
  id: number;
  role: string;
};

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthenticatedUser;
    file?: Express.Multer.File;
  }
}

export type AuthenticatedRequest = Request & {
  authUser: AuthenticatedUser;
};
