import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import type { FileFilterCallback } from "multer";
import type { Request } from "express";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(currentDir, "../../uploads/products");

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, callback) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    callback(null, uploadsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, callback) => {
    const extension = path.extname(file.originalname) || ".jpg";
    const safeBaseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, "-")
      .toLowerCase()
      .slice(0, 40);

    callback(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBaseName}${extension}`
    );
  },
});

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image uploads are allowed"));
      return;
    }

    callback(null, true);
  },
});
