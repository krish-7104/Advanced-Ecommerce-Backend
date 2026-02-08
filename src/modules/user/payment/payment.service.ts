import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { stripe } from "../../../app";
import "dotenv/config";

export const createPaymentIntentService = async (orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
    },
    include: {
      items: true,
      payments: true,
      address: true,
      user: true,
    },
  });

  if (!order) {
    throw new ApiError(400, "Order not Found!");
  }

  const formattedItem = order.items.map((item) => {
    return {
      ...item,
      attributes: JSON.parse(item.attributes as string),
    };
  });

  const lineItems = formattedItem.map((item) => {
    const attributesText = Object.values(item.attributes).join(" ");

    return {
      price_data: {
        currency: "inr",
        product_data: {
          name: `${item.name} (${attributesText})`,
        },
        unit_amount: Number(item.price) * 100,
      },
      quantity: item.quantity,
    };
  });

  let session;

  try {
    session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${process.env.FRONTEND_URL!}/order/${orderId}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL!}/order/${orderId}?payment=failure`,
      metadata: {
        orderId,
      },
    });
  } catch (error: any) {
    throw new ApiError(500, error?.message);
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
  };
};
