import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";
import { checkPermission } from "../../../middlewares/rbac.middleware";
import {
  getAllOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
} from "./order.controller.js";

const router = express.Router();

router.get(
  "/",
  adminAuthMiddleware,
  checkPermission("orders.view"),
  getAllOrdersController,
);
router.get(
  "/:id",
  adminAuthMiddleware,
  checkPermission("orders.view"),
  getOrderByIdController,
);
router.patch(
  "/:id/status",
  adminAuthMiddleware,
  checkPermission("orders.update"),
  updateOrderStatusController,
);

export default router;
