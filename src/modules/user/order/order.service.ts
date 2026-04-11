import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { notifyOrderStatusEmail } from "../../../utils/order-email.js";
import {
  OrderStatus,
  CartItemStatus,
} from "../../../../generated/prisma/enums";
import { stripe } from "../../../app";
import {
  CreateOrderPayload,
  UpdateOrderStatusPayload,
  OrderQueryParams,
} from "./order.types";
import { emitLiveDashboardService } from "../../admin/dashboard/dashboard.service.js";

export const createOrderService = async (
  payload: CreateOrderPayload,
  userId: string,
) => {
  const { addressId } = payload;

  // Verify address belongs to user
  const address = await prisma.address.findFirst({
    where: {
      id: addressId,
      userId: userId,
    },
  });

  if (!address) {
    throw new ApiError(404, "Address not found or does not belong to user");
  }

  // Get active cart items
  const cartItems = await prisma.cartItem.findMany({
    where: {
      userId: userId,
      status: CartItemStatus.ACTIVE,
    },
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  if (cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty. Cannot create order.");
  }

  // Validate stock availability and calculate total
  let totalAmount = 0;
  const orderItemsData: Array<{
    variantId: string;
    sku: string;
    name: string;
    attributes: any;
    price: any;
    mrp: any;
    quantity: number;
  }> = [];

  for (const cartItem of cartItems) {
    const variant = cartItem.variant;

    // Check stock availability
    if (variant.stockAvailable < cartItem.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for ${variant.product.name}.`,
      );
    }

    // Calculate item total (use price, not MRP)
    const itemTotal = Number(variant.price) * cartItem.quantity;
    totalAmount += itemTotal;

    // Prepare order item data (snapshot variant data)
    orderItemsData.push({
      variantId: variant.id,
      sku: variant.sku,
      name: variant.product.name,
      attributes: variant.attributes,
      price: variant.price,
      mrp: variant.mrp,
      quantity: cartItem.quantity,
    });
  }

  // Create order with order items in a transaction
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        userId: userId,
        addressId: addressId,
        status: OrderStatus.PENDING,
        totalAmount: totalAmount,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Update stock for each variant
    for (const cartItem of cartItems) {
      await tx.productVariant.update({
        where: { id: cartItem.variantId },
        data: {
          stockAvailable: {
            decrement: cartItem.quantity,
          },
          stockSold: {
            increment: cartItem.quantity,
          },
        },
      });
    }

    // Clear the cart
    await tx.cartItem.deleteMany({
      where: {
        userId: userId,
        status: CartItemStatus.ACTIVE,
      },
    });

    return newOrder;
  });

  notifyOrderStatusEmail(order.id, OrderStatus.PENDING);
  emitLiveDashboardService();

  return order;
};

export const getUserOrdersService = async (
  userId: string,
  queryParams: OrderQueryParams,
) => {
  const { page = 1, limit = 10, status } = queryParams;
  const skip = (page - 1) * limit;

  const where: any = {
    userId: userId,
  };

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        address: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  const formattedOrders = orders.map((order) => {
    return {
      ...order,
      items: order.items.map((item) => {
        return {
          ...item,
          attributes:
            typeof item.attributes === "string"
              ? (JSON.parse(item.attributes as string) as Record<
                  string,
                  string
                >)
              : (item.attributes as Record<string, string>) || {},
        };
      }),
    };
  });

  return {
    orders: formattedOrders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getOrderByIdService = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: userId,
    },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      address: true,
      payments: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const formattedItems = order?.items.map((item) => {
    return {
      ...item,
      attributes:
        typeof item.attributes === "string"
          ? JSON.parse(item.attributes)
          : item.attributes || {},
    };
  });

  return { ...order, items: formattedItems };
};

export const getOrderByIdAdminService = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: true,
      address: true,
      payments: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  const formattedItems = order?.items.map((item) => {
    return {
      ...item,
      attributes:
        typeof item.attributes === "string"
          ? JSON.parse(item.attributes)
          : item.attributes || {},
    };
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return { ...order, items: formattedItems };
};

export const cancelOrderService = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: userId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only allow cancellation for PENDING or PAID orders
  const cancellableStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
  ];
  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(
      400,
      `Cannot cancel order with status ${order.status}. Only PENDING or PAID orders can be cancelled.`,
    );
  }

  // Update order status and restore stock in a transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Update order status
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
      },
      include: {
        items: true,
        address: true,
      },
    });

    // Restore stock for each order item
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockAvailable: {
            increment: item.quantity,
          },
          stockSold: {
            decrement: item.quantity,
          },
        },
      });
    }

    return updated;
  });

  const formattedItems = updatedOrder?.items.map((item) => {
    return {
      ...item,
      attributes:
        typeof item.attributes === "string"
          ? JSON.parse(item.attributes)
          : item.attributes || {},
    };
  });

  notifyOrderStatusEmail(orderId, OrderStatus.CANCELLED);
  emitLiveDashboardService();

  return { ...updatedOrder, items: formattedItems };
};

export const getAllOrdersService = async (queryParams: OrderQueryParams) => {
  const { page = 1, limit = 10, status } = queryParams;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
        address: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const formattedOrders = orders.map((order) => {
    return {
      ...order,
      items: order.items.map((item) => {
        return {
          ...item,
          attributes:
            typeof item.attributes === "string"
              ? JSON.parse(item.attributes)
              : item.attributes || {},
        };
      }),
    };
  });

  return {
    orders: formattedOrders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateOrderStatusService = async (
  orderId: string,
  payload: UpdateOrderStatusPayload,
) => {
  const { status } = payload;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Validate status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
    [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${order.status} to ${status}`,
    );
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
      address: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  notifyOrderStatusEmail(orderId, status);
  emitLiveDashboardService();

  return updatedOrder;
};

export const requestRefundService = async (
  orderId: string,
  userId: string,
  reason: string,
) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: userId,
    },
    include: {
      payments: true,
      items: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const refundableStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PACKED,
  ];

  if (!refundableStatuses.includes(order.status)) {
    throw new ApiError(
      400,
      `Cannot request refund for order with status ${order.status}.`,
    );
  }

  const existingRefund = await prisma.refundRequest.findUnique({
    where: { orderId },
  });

  if (existingRefund) {
    throw new ApiError(400, "Refund already requested for this order");
  }

  const successfulPayment = order.payments.find(
    (p) => p.status === "SUCCEEDED" && p.paymentIntentId,
  );

  if (
    (order.status === OrderStatus.PAID || order.status === OrderStatus.PACKED) &&
    !successfulPayment
  ) {
    throw new ApiError(
      400,
      "Payment is not complete yet. Try again in a moment or contact support.",
    );
  }

  if (order.status === OrderStatus.PENDING && !successfulPayment) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stockAvailable: { increment: item.quantity },
            stockSold: { decrement: item.quantity },
          },
        });
      }
      await tx.payment.updateMany({
        where: { orderId, status: "CREATED" },
        data: { status: "CANCELLED" },
      });
      return tx.order.findFirst({
        where: { id: orderId },
        include: {
          items: {
            include: {
              variant: { include: { product: true } },
            },
          },
          address: true,
          payments: true,
        },
      });
    });
    const formattedItems = updated?.items.map((item) => ({
      ...item,
      attributes:
        typeof item.attributes === "string"
          ? JSON.parse(item.attributes)
          : item.attributes || {},
    }));
    notifyOrderStatusEmail(orderId, OrderStatus.CANCELLED);

    return {
      outcome: "cancelled_unpaid" as const,
      order: updated ? { ...updated, items: formattedItems } : null,
    };
  }

  if (successfulPayment?.paymentIntentId) {
    try {
      await stripe.refunds.create({
        payment_intent: successfulPayment.paymentIntentId,
        metadata: { orderId, reason: reason || "customer_request" },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Refund failed";
      throw new ApiError(500, message);
    }
  }

  const refundRequest = await prisma.$transaction(async (tx) => {
    const refund = await tx.refundRequest.create({
      data: {
        orderId,
        userId,
        reason: reason || null,
        status: "APPROVED",
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    if (successfulPayment) {
      await tx.payment.update({
        where: { id: successfulPayment.id },
        data: { status: "REFUNDED" },
      });
    }

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockAvailable: { increment: item.quantity },
          stockSold: { decrement: item.quantity },
        },
      });
    }

    return refund;
  });

  notifyOrderStatusEmail(orderId, OrderStatus.REFUNDED);
  emitLiveDashboardService();

  return { outcome: "refunded" as const, refundRequest };
};
