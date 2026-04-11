import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  createCheckoutSessionService,
  stripePaymentWebhookService,
  syncCheckoutSessionService,
} from "./payment.service";
import ApiResponse from "../../../utils/ApiResponse";
import { stripe } from "../../../app";
import Stripe from "stripe";

export const createPaymentIntentController = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.userId;

    if (!orderId) {
      throw new ApiError(400, "OrderId is required!");
    }
    if (!userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const payment = await createCheckoutSessionService(orderId, userId);

    return res
      .status(200)
      .send(
        new ApiResponse(200, payment, "Payment intent created Successfully")
      );
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    const message =
      error instanceof Error ? error.message : "Payment session could not be created";
    throw new ApiError(500, message);
  }
};

export const syncCheckoutSessionController = async (
  req: Request,
  res: Response
) => {
  const { orderId } = req.params;
  const userId = req.user?.userId;
  const sessionId =
    typeof req.body?.sessionId === "string" ? req.body.sessionId : undefined;

  if (!orderId) {
    throw new ApiError(400, "OrderId is required");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const result = await syncCheckoutSessionService(orderId, userId, sessionId);

  const message = result.synced
    ? "Payment confirmed. Order is now paid."
    : result.alreadyPaid
      ? "Order is already paid."
      : "Payment not completed yet.";

  return res.status(200).send(new ApiResponse(200, result, message));
};

export const stripePaymentWebhookController = async (
  req: Request,
  res: Response
) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured");
    return res.status(500).json({
      error: "Webhook secret not configured",
    });
  }

  if (!sig) {
    console.error("Missing stripe-signature header");
    return res.status(400).json({
      error: "Missing stripe-signature header",
    });
  }

  // req.body is already a Buffer when using express.raw()
  const rawBody = req.body;

  let event: Stripe.Event;

  try {
    // Verify webhook signature using raw body
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret
    ) as Stripe.Event;
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({
      error: `Webhook signature verification failed: ${err.message}`,
    });
  }

  try {
    await stripePaymentWebhookService(event);
    // Return 200 to acknowledge receipt of the event
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    // Still return 200 to prevent Stripe from retrying
    // Log the error for manual investigation
    return res.status(200).json({
      received: true,
      error: error.message || "Error processing webhook",
    });
  }
};
