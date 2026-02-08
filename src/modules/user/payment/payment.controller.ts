import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  checkPaymentStatusService,
  createCheckoutSessionService,
} from "./payment.service";
import ApiResponse from "../../../utils/ApiResponse";

export const createPaymentIntentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new ApiError(400, "OrderId is required!");
    }

    const payment = await createCheckoutSessionService(orderId);

    return res
      .status(200)
      .send(
        new ApiResponse(200, payment, "Payment intent created Successfully"),
      );
  } catch (error: any) {
    console.log("Error in creating payment intent status");
    throw new ApiError(
      500,
      error?.message || "Error in checking payment status",
    );
  }
};

export const checkPaymentIntentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { intentId } = req.params;

    if (!intentId) {
      throw new ApiError(400, "intentId is required!");
    }

    const payment = await checkPaymentStatusService(intentId);

    return res
      .status(200)
      .send(new ApiResponse(200, payment, "Payment Intent status"));
  } catch (error: any) {
    console.log("Error in checking payment intent status", error);
    throw new ApiError(
      500,
      error?.message || "Error in checking payment status",
    );
  }
};
