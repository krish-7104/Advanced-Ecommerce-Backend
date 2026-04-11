import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import {
  createPaymentIntentController,
  syncCheckoutSessionController,
} from "./payment.controller";

const router = express.Router();

router.post(
  "/create-payment-intent/:orderId",
  authMiddleware,
  createPaymentIntentController
);

router.post(
  "/sync-checkout/:orderId",
  authMiddleware,
  syncCheckoutSessionController
);

export default router;
