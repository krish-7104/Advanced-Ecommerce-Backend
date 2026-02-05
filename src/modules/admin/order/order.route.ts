import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";
import {
  getAllOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
} from "./order.controller.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllOrdersController);
router.get("/:id", adminAuthMiddleware, getOrderByIdController);
router.patch(
  "/:id/status",
  adminAuthMiddleware,
  updateOrderStatusController
);

export default router;
