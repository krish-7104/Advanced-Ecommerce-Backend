import express from "express";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  createProductVariantController,
  deleteProductVariantController,
  getAllProductVariantsController,
  getProductVariantByIdController,
  updateProductVariantController,
  // updateProductVariantController,
  // deleteProductVariantController,
} from "./product-variant.controller.js";
import { upload } from "../../../utils/upload-handlers/multer.js";
import { parseFormData } from "../../../middlewares/parse-formdata.middleware.js";

const router = express.Router();

router.get("/all/:productId", authMiddleware, getAllProductVariantsController);
router.post(
  "/",
  authMiddleware,
  limitToAdmin,
  upload("product-variant").fields([{ name: "images", maxCount: 10 }]), // max 10 images
  parseFormData,
  createProductVariantController
);

router.get("/:id", authMiddleware, getProductVariantByIdController);

router.patch(
  "/:id",
  authMiddleware,
  limitToAdmin,
  upload("product-variant").fields([{ name: "images", maxCount: 10 }]),
  parseFormData,
  updateProductVariantController
);

router.delete(
  "/:id",
  authMiddleware,
  limitToAdmin,
  deleteProductVariantController
);

export default router;
