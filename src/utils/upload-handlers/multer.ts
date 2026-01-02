import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const upload = (type: string) => {
  const uploadPath = `media/${type}`;

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadPath);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path
          .basename(file.originalname, ext)
          .replace(/\s+/g, "-")
          .toLowerCase();

        cb(null, `${name}-${crypto.randomBytes(16).toString("hex")}${ext}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
};
