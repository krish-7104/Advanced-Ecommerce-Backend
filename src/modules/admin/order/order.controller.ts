import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getAllOrdersService,
  getOrderByIdAdminService,
  updateOrderStatusService,
} from "../../user/order/order.service";

export const getAllOrdersController = async (req: Request, res: Response) => {
  const { page, limit, status } = req.query;

  const result = await getAllOrdersService({
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
  const orderId = req.params.id;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  // For admin, we need to get order without userId restriction
  const order = await getOrderByIdAdminService(orderId);

  return res.send(new ApiResponse(200, order, "Order retrieved successfully"));
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response
) => {
  const orderId = req.params.id;

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await updateOrderStatusService(orderId, req.body);

  return res.send(
    new ApiResponse(200, order, "Order status updated successfully")
  );
};
