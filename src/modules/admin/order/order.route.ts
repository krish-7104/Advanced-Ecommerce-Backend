import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";
import {
  getAllOrdersController,
  getOrderByIdController,
  updateOrderStatusController,
} from "./order.controller.js";

const router = express.Router();

router.get("/", authMiddleware, limitToAdmin, getAllOrdersController);
router.get("/:id", authMiddleware, limitToAdmin, getOrderByIdController);
router.patch(
  "/:id/status",
  authMiddleware,
  limitToAdmin,
  updateOrderStatusController
);

export default router;
