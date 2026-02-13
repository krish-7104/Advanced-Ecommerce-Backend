import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { createPaymentIntentController } from "./payment.controller";

const router = express.Router();

router.post(
  "/create-payment-intent/:orderId",
  authMiddleware,
  createPaymentIntentController
);

export default router;
