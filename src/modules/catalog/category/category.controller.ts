import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  createCategorySerice,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
} from "./category.service";
import ApiResponse from "../../../utils/ApiResponse";

export const createCategoryController = async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    throw new ApiError(400, "name is required!");
  }

  const category = await createCategorySerice(req.body);

  res.send(new ApiResponse(201, category, "Category created successfully!"));
};

export const getAllCategorieController = async (
  req: Request,
  res: Response
) => {
  const queryParams = req.query;
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

export const updateCategoryController = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Category ID is required!");
  }
  const category = await updateCategoryService(id, req.body);
  res.send(new ApiResponse(200, category, "Category updated successfully!"));
};

export const deleteCategoryController = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Category ID is required!");
  }

  const category = await deleteCategoryService(id);
  res.send(new ApiResponse(200, category, "Category deleted successfully!"));
};
