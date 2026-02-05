import express from "express";
import { adminAuthMiddleware } from "../../../../middlewares/admin-auth.middleware.js";
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

router.get("/all", adminAuthMiddleware, getAllProductVariantsController);
router.post(
  "/",
  adminAuthMiddleware,
  upload("product-variant").fields([{ name: "images", maxCount: 10 }]), // max 10 images
  parseFormData,
  createProductVariantController
);

router.get("/:id", adminAuthMiddleware, getProductVariantByIdController);

router.patch(
  "/:id",
  adminAuthMiddleware,
  upload("product-variant").fields([{ name: "images", maxCount: 10 }]),
  parseFormData,
  updateProductVariantController
);

router.delete(
  "/:id",
  adminAuthMiddleware,
  deleteProductVariantController
);

export default router;
