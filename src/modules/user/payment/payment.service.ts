import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { stripe } from "../../../app";
import "dotenv/config";
import Stripe from "stripe";
import { getOrderByIdService } from "../order/order.service.js";
type ParsedAttributes = Record<string, string>;

const parseAttributes = (raw: unknown): ParsedAttributes => {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ParsedAttributes;
  }
  if (!raw || typeof raw !== "string") return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const createCheckoutSessionService = async (
  orderId: string,
  userId: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== "PENDING") {
    throw new ApiError(400, "This order cannot be paid for anymore");
  }

  const existingPayment = order.payments.find((p) => p.status === "CREATED");
  if (existingPayment) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        existingPayment.intentId
      );
      if (session.status === "open" && session.url) {
        return { url: session.url, sessionId: session.id };
      }
    } catch {
      // session missing in Stripe
    }
    await prisma.payment.updateMany({
      where: { id: existingPayment.id },
      data: { status: "CANCELLED" },
    });
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const customerEmail =
    user?.email && user.email.trim().length > 0 ? user.email.trim() : undefined;

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        success_url: `${process.env.FRONTEND_URL}/order/${orderId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/order/${orderId}?payment=failure`,
        metadata: { orderId },
        payment_intent_data: {
          metadata: { orderId },
          ...(customerEmail ? { receipt_email: customerEmail } : {}),
        },
        expand: ["payment_intent"],
      },
      {
        idempotencyKey: `checkout_${orderId}_${Date.now()}`,
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

export const syncCheckoutSessionService = async (
  orderId: string,
  userId: string,
  checkoutSessionId?: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status === "PAID") {
    return {
      synced: false,
      alreadyPaid: true,
      order: await getOrderByIdService(orderId, userId),
    };
  }

  if (order.status !== "PENDING") {
    throw new ApiError(400, "Order cannot be synced for payment");
  }

  let sessionId = checkoutSessionId?.trim();
  if (!sessionId) {
    const latest = order.payments.find((p) => p.intentId?.startsWith("cs_"));
    sessionId = latest?.intentId;
  }

  if (!sessionId) {
    throw new ApiError(400, "No checkout session for this order");
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Stripe error";
    throw new ApiError(400, message);
  }

  if (session.metadata?.orderId !== orderId) {
    throw new ApiError(403, "Checkout session does not match this order");
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId, intentId: session.id },
  });

  if (!payment) {
    throw new ApiError(404, "Payment record not found for this session");
  }

  if (session.payment_status !== "paid") {
    return {
      synced: false,
      alreadyPaid: false,
      order: await getOrderByIdService(orderId, userId),
    };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        paymentIntentId: paymentIntentId || payment.paymentIntentId,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "PAID" },
    }),
  ]);

  return {
    synced: true,
    alreadyPaid: false,
    order: await getOrderByIdService(orderId, userId),
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
            paymentIntentId: null,
          },
          orderBy: { createdAt: "desc" },
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

        const payment = await prisma.payment.findFirst({
          where: { paymentIntentId },
        });

        if (!payment && orderId) {
          const fallback = await prisma.payment.findFirst({
            where: { orderId },
            orderBy: { createdAt: "desc" },
          });
          if (fallback && fallback.orderId === orderId) {
            await prisma.payment.update({
              where: { id: fallback.id },
              data: {
                status: "SUCCEEDED",
                paymentIntentId,
              },
            });
            await prisma.order.update({
              where: { id: fallback.orderId },
              data: { status: "PAID" },
            });
          }
          break;
        }

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

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!paymentIntentId) break;
        const payment = await prisma.payment.findFirst({
          where: { paymentIntentId },
        });
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "REFUNDED" },
          });
        }
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
