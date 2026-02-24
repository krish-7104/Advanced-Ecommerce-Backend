import { Request, Response } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getLowStockItemsService,
  getOrderStatusGraphService,
  getProductCountByParentCategoryService,
  getStatsService,
  getTopSellingProductsService,
} from "./dashboard.service";

export const getStatsController = async (req: Request, res: Response) => {
  const stats = await getStatsService();

  res.send(new ApiResponse(200, stats, "Stats fetched successfully"));
};

export const getOrderStatusGraphController = async (
  req: Request,
  res: Response,
) => {
  const data = await getOrderStatusGraphService();
  res.send(
    new ApiResponse(200, data, "Order status distribution fetched successfully"),
  );
};

export const getTopSellingProductsController = async (
  req: Request,
  res: Response,
) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const data = await getTopSellingProductsService(limit);
  res.send(
    new ApiResponse(
      200,
      data,
      "Top selling products fetched successfully",
    ),
  );
};

export const getLowStockItemsController = async (
  req: Request,
  res: Response,
) => {
  const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  const data = await getLowStockItemsService(threshold, limit);
  res.send(
    new ApiResponse(200, data, "Low stock items fetched successfully"),
  );
};

export const getProductCountByParentCategoryController = async (
  req: Request,
  res: Response,
) => {
  const data = await getProductCountByParentCategoryService();
  res.send(
    new ApiResponse(
      200,
      data,
      "Product count by parent category fetched successfully",
    ),
  );
};
