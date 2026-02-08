import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { stripe } from "../../../app";
import "dotenv/config";

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
      },
      {
        idempotencyKey: `checkout_${orderId}`,
      },
    );
  } catch (err: any) {
    throw new ApiError(500, err?.message || "Stripe checkout creation failed");
  }

  await prisma.payment.create({
    data: {
      orderId,
      stripeIntentId: session.id,
      status: "CREATED",
      amount: order.totalAmount,
      currency: "INR",
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
};

export const checkPaymentStatusService = async (sessionId: string) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    return {
      status: session.payment_status,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
    };
  } catch (err: any) {
    throw new ApiError(
      500,
      err?.message || "Failed to retrieve payment status",
    );
  }
};
