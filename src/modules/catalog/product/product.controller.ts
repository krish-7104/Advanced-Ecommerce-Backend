import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  createProductSerice,
  deleteProductService,
  getAllProductsService,
  getProductByIdService,
  updateProductService,
} from "./product.service";
import ApiResponse from "../../../utils/ApiResponse";
import { GetAllProductsQueryParams } from "./product.types";

export const createProductController = async (req: Request, res: Response) => {
  const { name, attributesSchema, categoryId } = req.body;
  if (!name) {
    throw new ApiError(400, "name is required!");
  }
  if (!attributesSchema) {
    throw new ApiError(400, "attributesSchema is required!");
  } else {
    let parsedAttributesSchema: any = {};

    // {
    //   "0": { "key": "Color", "options": ["Red", "Blue"] },
    //   "1": { "key": "Size", "options": ["S", "M"] }
    // }

    const keys = Object.keys(parsedAttributesSchema);
    const options = Object.values(parsedAttributesSchema);
    if (keys.length !== new Set(keys).size) {
      throw new ApiError(400, "Attributes schema keys must be unique!");
    }
    if (
      options.some(
        (option: any) => !option.options || option.options.length === 0
      )
    ) {
      throw new ApiError(
        400,
        "Attributes schema options must be an array and must have at least one option!"
      );
    }

    req.body.attributesSchema = parsedAttributesSchema;
  }

  if (!categoryId) {
    throw new ApiError(400, "categoryId is required!");
  }

  const Product = await createProductSerice(req.body);

  res.send(new ApiResponse(201, Product, "Product created successfully!"));
};

export const getAllProductsController = async (req: Request, res: Response) => {
  const queryParams = req.query;
  const products = await getAllProductsService(
    queryParams as any as GetAllProductsQueryParams
  );
  res.send(new ApiResponse(201, products, "Products get successfully!"));
};

export const getProductByIdController = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }
  const Product = await getProductByIdService(id);
  res.send(new ApiResponse(200, Product, "Product get successfully!"));
};

export const updateProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }
  const Product = await updateProductService(id, req.body);
  res.send(new ApiResponse(200, Product, "Product updated successfully!"));
};

export const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }

  const Product = await deleteProductService(id);
  res.send(new ApiResponse(200, Product, "Product deleted successfully!"));
};
