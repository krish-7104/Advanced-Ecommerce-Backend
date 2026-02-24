import express from "express";
import { adminAuthMiddleware } from "../../../../middlewares/admin-auth.middleware.js";
import { checkPermission } from "../../../../middlewares/rbac.middleware";
import {
  createProductVariantController,
  deleteProductVariantController,
  getAllProductVariantsController,
  getProductVariantByIdController,
  updateProductVariantController,
  // updateProductVariantController,
  // deleteProductVariantController,
} from "./product-variant.controller.js";
import { upload } from "../../../../utils/upload-handlers/multer.js";
import { parseFormData } from "../../../../middlewares/parse-formdata.middleware.js";

const router = express.Router();

router.get(
  "/all",
  adminAuthMiddleware,
  checkPermission("product-variants.view"),
  getAllProductVariantsController,
);
router.post(
  "/",
  adminAuthMiddleware,
  upload("product-variant").fields([{ name: "images", maxCount: 10 }]), // max 10 images
  parseFormData,
  checkPermission("product-variants.create"),
  createProductVariantController,
);

router.get(
  "/:id",
  adminAuthMiddleware,
  checkPermission("product-variants.view"),
  getProductVariantByIdController,
);

router.patch(
  "/:id",
  adminAuthMiddleware,
  upload("product-variant").fields([{ name: "images", maxCount: 10 }]),
  parseFormData,
  checkPermission("product-variants.update"),
  updateProductVariantController,
);

router.delete(
  "/:id",
  adminAuthMiddleware,
  checkPermission("product-variants.delete"),
  deleteProductVariantController,
);

export default router;
