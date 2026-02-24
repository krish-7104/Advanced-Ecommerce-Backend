import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware";
import { checkPermission } from "../../../middlewares/rbac.middleware";
import {
  getLowStockItemsController,
  getOrderStatusGraphController,
  getProductCountByParentCategoryController,
  getStatsController,
  getTopSellingProductsController,
} from "./dashboard.controller";

const router = express.Router();

router.use(adminAuthMiddleware);

router.get("/stats", checkPermission("dashboard.view"), getStatsController);
router.get(
  "/orders/status-graph",
  checkPermission("dashboard.view"),
  getOrderStatusGraphController,
);
router.get(
  "/products/top-selling",
  checkPermission("dashboard.view"),
  getTopSellingProductsController,
);
router.get(
  "/products/low-stock",
  checkPermission("dashboard.view"),
  getLowStockItemsController,
);
router.get(
  "/categories/product-count",
  checkPermission("dashboard.view"),
  getProductCountByParentCategoryController,
);

export default router;
