import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  createProductVariantService,
  deleteProductVariantService,
  getAllProductVariantsService,
  getProductVariantByIdService,
  updateProductVariantService,
  // deleteProductVariantService,
  // updateProductVariantService,
} from "./product-variant.service";
import ApiResponse from "../../../utils/ApiResponse";

export const createProductVariantController = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;
  let { sku, attributes, price, stockAvailable, imageSequence = [] } = req.body;

  const images = (req.files as any)?.images;

  imageSequence = imageSequence ? JSON.parse(imageSequence) : [];

  const errors: string[] = [];

  if (!productId) errors.push("productId");
  if (!sku) errors.push("sku");
  if (Object.keys(attributes).length == 0) errors.push("attributes");
  if (price == null) errors.push("price");
  if (stockAvailable == null) errors.push("stockAvailable");
  if (!Array.isArray(images) || images.length === 0) {
    errors.push("at least one image");
  }

  if (errors.length) {
    throw new ApiError(400, errors.join(", ") + " is required");
  }

  const variant = await createProductVariantService(
    req.body,
    productId,
    images,
    imageSequence
  );

  res
    .status(201)
    .json(new ApiResponse(201, variant, "Variant created successfully"));
};

export const getAllProductVariantsController = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;
  const productVariants = await getAllProductVariantsService(productId);
  res.send(
    new ApiResponse(201, productVariants, "Product Variants get successfully!")
  );
};

export const getProductVariantByIdController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Variant Id is required!");
  }
  const Product = await getProductVariantByIdService(id);
  res.send(new ApiResponse(200, Product, "Product get successfully!"));
};

export const updateProductVariantController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  let { imageSequence } = req.body;
  if (!id) {
    throw new ApiError(400, "Product Variant ID is required");
  }

  const images = (req.files as any)?.images;

  const updatedVariant = await updateProductVariantService(
    id,
    req.body,
    images,
    imageSequence ? JSON.parse(imageSequence) : []
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedVariant, "Variant updated successfully"));
};

export const deleteProductVariantController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Product Variant ID is required");
  }

  await deleteProductVariantService(id);
  res.send(new ApiResponse(200, [], "Variant deleted successfully"));
};
