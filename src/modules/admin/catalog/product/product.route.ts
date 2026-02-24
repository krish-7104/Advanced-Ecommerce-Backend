import express from "express";
import { adminAuthMiddleware } from "../../../../middlewares/admin-auth.middleware.js";
import { checkPermission } from "../../../../middlewares/rbac.middleware";
import {
  createProductController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  getAllProductsController,
} from "./product.controller.js";

const router = express.Router();

router.get(
  "/",
  adminAuthMiddleware,
  checkPermission("products.view"),
  getAllProductsController,
);
router.post(
  "/",
  adminAuthMiddleware,
  checkPermission("products.create"),
  createProductController,
);
router.get(
  "/:id",
  adminAuthMiddleware,
  checkPermission("products.view"),
  getProductByIdController,
);
router.patch(
  "/:id",
  adminAuthMiddleware,
  checkPermission("products.update"),
  updateProductController,
);
router.delete(
  "/:id",
  adminAuthMiddleware,
  checkPermission("products.delete"),
  deleteProductController,
);

export default router;
