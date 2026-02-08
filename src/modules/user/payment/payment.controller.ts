import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import { createPaymentIntentService } from "./payment.service";
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

    const payment = await createPaymentIntentService(orderId);

    console.log(payment);

    return res
      .status(200)
      .send(
        new ApiResponse(200, payment, "Payment intent created Successfully"),
      );
  } catch {}
};
