import { Request, Response } from "express";
import ApiError from "../../../../utils/ApiError";
import {
  createProductSerice,
  deleteProductService,
  getAllProductsService,
  getProductByIdService,
  updateProductService,
} from "./product.service";
import ApiResponse from "../../../../utils/ApiResponse";
import { GetAllProductsQueryParams } from "./product.types";
import { addToAuditLog } from "../../../../helper/addToAuditLog";

export const createProductController = async (req: Request, res: Response) => {
  const { name, attributesSchema, categoryId } = req.body;
  const user = req.user;

  if (!name) {
    throw new ApiError(400, "name is required!");
  }
  if (!attributesSchema) {
    throw new ApiError(400, "attributesSchema is required!");
  } else {
    const keys = Object.keys(attributesSchema);
    const options = Object.values(attributesSchema);
    if (keys.length === 0) {
      throw new ApiError(400, "Attributes schema must have at least one key!");
    }
    if (keys.length !== new Set(keys).size) {
      throw new ApiError(400, "Attributes schema keys must be unique!");
    }
    if (
      options.some(
        (option: any) => !option.options || option.options.length === 0,
      )
    ) {
      throw new ApiError(
        400,
        "Attributes schema options must be an array and must have at least one option!",
      );
    }
  }

  if (!categoryId) {
    throw new ApiError(400, "categoryId is required!");
  }

  const Product = await createProductSerice(req.body);

  addToAuditLog("CREATE", null, Product, user?.userId, Product.id, "Product");

  res.send(new ApiResponse(201, Product, "Product created successfully!"));
};

export const getAllProductsController = async (req: Request, res: Response) => {
  const queryParams = req.query;
  const products = await getAllProductsService(
    queryParams as any as GetAllProductsQueryParams,
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
  const user = req.user;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }
  const Product = await updateProductService(id, req.body);

  const { beforeProduct, ...afterProduct } = Product;

  addToAuditLog(
    "UPDATE",
    beforeProduct,
    afterProduct,
    user?.userId,
    id,
    "Product",
  );

  res.send(new ApiResponse(200, afterProduct, "Product updated successfully!"));
};

export const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;
  if (!id) {
    throw new ApiError(400, "Product ID is required!");
  }

  const Product = await deleteProductService(id);

  addToAuditLog("DELETE", Product, null, user?.userId, Product.id, "Product");

  res.send(new ApiResponse(200, Product, "Product deleted successfully!"));
};
