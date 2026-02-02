import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import ApiResponse from "../../../utils/ApiResponse";
import {
  createOrderService,
  getUserOrdersService,
  getOrderByIdService,
  cancelOrderService,
} from "./order.service";

export const createOrderController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const order = await createOrderService(req.body, userId);

  return res
    .status(201)
    .send(new ApiResponse(201, order, "Order created successfully"));
};

export const getUserOrdersController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const { page, limit, status } = req.query;

  const result = await getUserOrdersService(userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status: status as any,
  });

  return res.send(
    new ApiResponse(
      200,
      result.orders,
      "Orders retrieved successfully",
      result.pagination
    )
  );
};

export const getOrderByIdController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const orderId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await getOrderByIdService(orderId, userId);

  return res.send(new ApiResponse(200, order, "Order retrieved successfully"));
};

export const cancelOrderController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const orderId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await cancelOrderService(orderId, userId);

  return res.send(new ApiResponse(200, order, "Order cancelled successfully"));
};
