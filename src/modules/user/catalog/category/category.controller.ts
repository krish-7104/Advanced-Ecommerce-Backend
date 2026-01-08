import { Request, Response } from "express";
import ApiError from "../../../../utils/ApiError";
import {
  getAllCategoriesService,
  getCategoryByIdService,
} from "./category.service";
import ApiResponse from "../../../../utils/ApiResponse";
import { GetAllCategoriesQueryParams } from "./category.types";

export const getAllCategoriesController = async (
  req: Request,
  res: Response
) => {
  const queryParams = req.query as GetAllCategoriesQueryParams;
  const categories = await getAllCategoriesService(queryParams);
  res.send(new ApiResponse(200, categories, "Categories get successfully!"));
};

export const getCategoryByIdController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Category ID is required!");
  }
  const category = await getCategoryByIdService(id);
  res.send(new ApiResponse(200, category, "Category get successfully!"));
};
