import { Request, Response } from "express";
import ApiError from "../../../../utils/ApiError";
import {
  getAllProductsService,
  getProductByIdService,
} from "./product.service";
import ApiResponse from "../../../../utils/ApiResponse";
import { GetAllProductsQueryParams } from "./product.types";

export const getAllProductsController = async (req: Request, res: Response) => {
  const { page, limit, featured, search } =
    req.query as GetAllProductsQueryParams;

  const featuredFlag = featured && featured === "true" ? true : undefined;

  const products = await getAllProductsService({
    page: Number(page),
    limit: Number(limit),
    featured: featuredFlag,
    search,
  });
  res.send(
    new ApiResponse(
      200,
      products?.data,
      "Products get successfully!",
      products?.pagination
    )
  );
};

export const getProductByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }
  const Product = await getProductByIdService(id);
  res.send(new ApiResponse(200, Product, "Product get successfully!"));
};
