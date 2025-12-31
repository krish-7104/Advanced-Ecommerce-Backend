import express from "express";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  createProductVariantController,
  getProductVariantByIdController,
  updateProductVariantController,
  deleteProductVariantController,
  getAllProductVariantsController,
} from "./product-variant.controller.js";

const router = express.Router();

router.get("/:productId", authMiddleware, getAllProductVariantsController);
router.post(
  "/:productId",
  authMiddleware,
  limitToAdmin,
  createProductVariantController
);
router.get("/:productId/:id", authMiddleware, getProductVariantByIdController);
router.patch(
  "/:productId/:id",
  authMiddleware,
  limitToAdmin,
  updateProductVariantController
);
router.delete(
  "/:productId/:id",
  authMiddleware,
  limitToAdmin,
  deleteProductVariantController
);

export default router;
