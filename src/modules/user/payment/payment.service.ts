import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { stripe } from "../../../app";
import "dotenv/config";
import Stripe from "stripe";
type ParsedAttributes = Record<string, string>;

const parseAttributes = (raw: unknown): ParsedAttributes => {
  if (!raw || typeof raw !== "string") return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const createCheckoutSessionService = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Prevent duplicate Stripe sessions
  const existingPayment = order.payments.find((p) => p.status === "CREATED");

  if (existingPayment) {
    throw new ApiError(400, "Payment session already exists for this order");
  }

  const lineItems = order.items.map((item) => {
    const attributes = parseAttributes(item.attributes);
    const attributesText = Object.values(attributes).join(" ");

    return {
      price_data: {
        currency: "inr",
        product_data: {
          name: attributesText ? `${item.name} (${attributesText})` : item.name,
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    };
  });

  if (!lineItems.length) {
    throw new ApiError(400, "Order has no items");
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url: `${process.env.FRONTEND_URL}/order/${orderId}?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}/order/${orderId}?payment=failure`,
        metadata: { orderId },
        payment_intent_data: {
          metadata: { orderId },
        },
        expand: ["payment_intent"],
      },
      {
        idempotencyKey: `checkout_${orderId}`,
      }
    );
  } catch (err: any) {
    throw new ApiError(500, err?.message || "Stripe checkout creation failed");
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.payment.create({
    data: {
      orderId,
      intentId: session.id,
      status: "CREATED",
      amount: order.totalAmount,
      currency: "INR",
      paymentIntentId,
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
};

export const stripePaymentWebhookService = async (event: Stripe.Event) => {
  try {
    console.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

        if (!orderId) {
          console.error("OrderId not found in checkout.session.completed");
          return;
        }

        // Update payment using intentId (session.id) or paymentIntentId
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { intentId: session.id },
              ...(paymentIntentId ? [{ paymentIntentId }] : []),
            ],
          },
        });

        if (!payment) {
          console.error(`Payment not found for session ${session.id}`);
          return;
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: session.payment_status === "paid" ? "SUCCEEDED" : "FAILED",
            paymentIntentId: paymentIntentId || payment.paymentIntentId,
          },
        });

        await prisma.order.update({
          where: {
            id: payment.orderId,
          },
          data: {
            status: session.payment_status === "paid" ? "PACKED" : "PENDING",
          },
        });

        if (session.payment_status === "paid") {
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { status: "PAID" },
          });
        }

        break;
      }

      case "payment_intent.created": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        const paymentIntentId = paymentIntent.id;

        if (!orderId) {
          console.log("OrderId not found in payment_intent.created - skipping");
          return;
        }

        // Update payment with paymentIntentId when it's created
        const payment = await prisma.payment.findFirst({
          where: {
            orderId,
          },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              paymentIntentId,
              status: "PROCESSING",
            },
          });
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        const paymentIntentId = paymentIntent.id;

        if (!orderId) {
          console.error("OrderId not found in payment_intent.succeeded");
          return;
        }

        // Find payment by paymentIntentId or orderId
        const payment = await prisma.payment.findFirst({
          where: {
            OR: [{ paymentIntentId }, { orderId }],
          },
        });

        if (!payment) {
          console.error(
            `Payment not found for payment intent ${paymentIntentId}`
          );
          return;
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCEEDED",
            paymentIntentId,
          },
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "PAID" },
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        const orderId = paymentIntent.metadata?.orderId;

        const payment = await prisma.payment.findFirst({
          where: {
            OR: [{ paymentIntentId }, ...(orderId ? [{ orderId }] : [])],
          },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              paymentIntentId,
            },
          });
        }

        break;
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        const orderId = paymentIntent.metadata?.orderId;

        const payment = await prisma.payment.findFirst({
          where: {
            OR: [{ paymentIntentId }, ...(orderId ? [{ orderId }] : [])],
          },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "CANCELLED",
              paymentIntentId,
            },
          });
        }

        break;
      }

      case "payment_intent.processing": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const paymentIntentId = paymentIntent.id;
        const orderId = paymentIntent.metadata?.orderId;

        const payment = await prisma.payment.findFirst({
          where: {
            OR: [{ paymentIntentId }, ...(orderId ? [{ orderId }] : [])],
          },
        });

        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PROCESSING",
              paymentIntentId,
            },
          });
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    throw error;
  }
};
