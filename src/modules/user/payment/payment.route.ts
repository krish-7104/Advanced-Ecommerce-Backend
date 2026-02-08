import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import {
  checkPaymentIntentController,
  createPaymentIntentController,
} from "./payment.controller";

const router = express.Router();

router.post(
  "/create-payment-intent/:orderId",
  authMiddleware,
  createPaymentIntentController,
);

router.post(
  "/check-payment-intent/:intentId",
  authMiddleware,
  checkPaymentIntentController,
);

export default router;
