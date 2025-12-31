import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  createProductVariantSerice,
  deleteProductVariantService,
  getAllProductVariantsService,
  updateProductVariantService,
} from "./product-variant.service";
import ApiResponse from "../../../utils/ApiResponse";
import { getProductByIdService } from "../product/product.service";

export const createProductVariantController = async (
  req: Request,
  res: Response
) => {
  const { name, attributesSchema, categoryId } = req.body;
  if (!name) {
    throw new ApiError(400, "name is required!");
  }
  if (!attributesSchema) {
    throw new ApiError(400, "attributesSchema is required!");
  }
  if (!categoryId) {
    throw new ApiError(400, "categoryId is required!");
  }

  const Product = await createProductVariantSerice(req.body);

  res.send(new ApiResponse(201, Product, "Product created successfully!"));
};

export const getAllProductVariantsController = async (
  req: Request,
  res: Response
) => {
  const queryParams = req.query;
  const categories = await getAllProductVariantsService();
  res.send(new ApiResponse(201, categories, "Categories get successfully!"));
};

export const getProductVariantByIdController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }
  const Product = await getProductByIdService(id);
  res.send(new ApiResponse(200, Product, "Product get successfully!"));
};

export const updateProductVariantController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }
  const Product = await updateProductVariantService(id, req.body);
  res.send(new ApiResponse(200, Product, "Product updated successfully!"));
};

export const deleteProductVariantController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }

  const Product = await deleteProductVariantService(id);
  res.send(new ApiResponse(200, Product, "Product deleted successfully!"));
};
