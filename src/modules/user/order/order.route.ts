import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  createOrderController,
  getUserOrdersController,
  getOrderByIdController,
  cancelOrderController,
  requestRefundController,
} from "./order.controller.js";

const router = express.Router();

router.post("/", authMiddleware, createOrderController);
router.get("/", authMiddleware, getUserOrdersController);
router.get("/:id", authMiddleware, getOrderByIdController);
router.patch("/:id/cancel", authMiddleware, cancelOrderController);
router.post("/:id/refund", authMiddleware, requestRefundController);

export default router;
