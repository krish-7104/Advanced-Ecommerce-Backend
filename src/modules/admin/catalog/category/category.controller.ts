import { Request, Response } from "express";
import ApiError from "../../../../utils/ApiError";
import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
} from "./category.service";
import ApiResponse from "../../../../utils/ApiResponse";
import { addToAuditLog } from "../../../../helper/addToAuditLog";

export const createCategoryController = async (req: Request, res: Response) => {
  const { name } = req.body;
  const user = req.user;
  const image = req.file as any;

  if (!name) throw new ApiError(400, "name is required!");
  if (!image) throw new ApiError(400, "image is required!");

  const category = await createCategoryService(req.body, image);

  addToAuditLog(
    "CREATE",
    null,
    category.afterCreate,
    user?.userId,
    category.id,
    "Category",
  );

  const { afterCreate, ...cleanCategory } = category;

  res.send(
    new ApiResponse(201, cleanCategory, "Category created successfully!"),
  );
};
export const getAllCategoriesController = async (
  req: Request,
  res: Response,
) => {
  const queryParams = req.query;
  const categories = await getAllCategoriesService(queryParams);
  res.send(new ApiResponse(200, categories, "Categories get successfully!"));
};

export const getCategoryByIdController = async (
  req: Request,
  res: Response,
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
  const user = req.user;
  const imageFile = req.file as any;
  if (!id) {
    throw new ApiError(400, "Category ID is required!");
  }

  const category = await updateCategoryService(id, req.body, imageFile);

  const { beforeCategory, ...cleanCategory } = category;

  const { image, containsImage, ...withoutImageCategory } = cleanCategory;
  addToAuditLog(
    "UPDATE",
    beforeCategory,
    withoutImageCategory,
    user?.userId,
    category.id,
    "Category",
  );

  res.send(
    new ApiResponse(200, cleanCategory, "Category updated successfully!"),
  );
};

export const deleteCategoryController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  if (!id) {
    throw new ApiError(400, "Category ID is required!");
  }

  const category = await deleteCategoryService(id);
  addToAuditLog(
    "DELETE",
    category,
    null,
    user?.userId,
    category.id,
    "Category",
  );

  res.send(new ApiResponse(200, category, "Category deleted successfully!"));
};
