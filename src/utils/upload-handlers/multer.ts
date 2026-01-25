import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../cloudinary.config";

export const upload = (type: string) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (_req, _file) => {
      return {
        folder: `ecommercely/${type}`,
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      };
    },
  });

  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });
};
