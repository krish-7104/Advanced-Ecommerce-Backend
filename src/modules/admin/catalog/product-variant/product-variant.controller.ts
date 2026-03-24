import { Request, Response } from "express";
import ApiError from "../../../../utils/ApiError";
import {
  createProductVariantService,
  deleteProductVariantService,
  getAllProductVariantsService,
  getProductVariantByIdService,
  updateProductVariantService,
} from "./product-variant.service";
import ApiResponse from "../../../../utils/ApiResponse";
import { addToAuditLog } from "../../../../helper/addToAuditLog";

export const createProductVariantController = async (
  req: Request,
  res: Response,
) => {
  let {
    sku,
    attributes,
    price,
    stockAvailable,
    coverImageIndex,
    productId,
    imageUrls,
  } = req.body;
  const user = req.user;

  const uploadedImages = (req.files as any)?.images || [];

  // Handles: JSON string (from multipart), plain array (from JSON body), or single string
  let urlImages: string[] = [];
  if (imageUrls) {
    try {
      const parsed =
        typeof imageUrls === "string" ? JSON.parse(imageUrls) : imageUrls;
      urlImages = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      urlImages = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    }
  }

  const images: (Express.Multer.File | string)[] = [
    ...uploadedImages,
    ...urlImages,
  ];

  const errors: string[] = [];

  if (!productId) errors.push("productId");
  if (!sku) errors.push("sku");
  if (Object.keys(attributes).length == 0) errors.push("attributes");
  if (price == null) errors.push("price");
  if (stockAvailable == null) errors.push("stockAvailable");
  if (images.length === 0) {
    errors.push("at least one image (file upload or URL)");
  }
  coverImageIndex = Number(coverImageIndex) || 0;

  if (errors.length) {
    throw new ApiError(400, errors.join(", ") + " is required");
  }

  const variant = await createProductVariantService(
    req.body,
    productId,
    images,
    coverImageIndex,
  );

  addToAuditLog(
    "CREATE",
    null,
    variant,
    user?.userId,
    variant.id,
    "Product_Variant",
  );

  res
    .status(201)
    .json(new ApiResponse(201, variant, "Variant created successfully"));
};

export const getAllProductVariantsController = async (
  req: Request,
  res: Response,
) => {
  const productVariants = await getAllProductVariantsService();
  res.send(
    new ApiResponse(201, productVariants, "Product Variants get successfully!"),
  );
};

export const getProductVariantByIdController = async (
  req: Request,
  res: Response,
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
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;

  if (!id) {
    throw new ApiError(400, "Product Variant ID is required");
  }

  const uploadedImages = (req.files as any)?.images || [];
  let {
    imageUrls,
    deleteImageIds,
    reorderImages,
    newImageOrder,
    coverImageIndex,
    coverImageId,
    ...variantPayload
  } = req.body;

  let urlImages: string[] = [];
  if (imageUrls) {
    try {
      const parsed =
        typeof imageUrls === "string" ? JSON.parse(imageUrls) : imageUrls;
      urlImages = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      urlImages = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    }
  }

  const uploadImages: (Express.Multer.File | string)[] = [
    ...uploadedImages,
    ...urlImages,
  ];

  let parsedDeleteImageIds: string[] = [];
  let parsedReorderImages: { id: string; order: number }[] = [];
  let parsedNewImageOrder: number[] = [];

  try {
    if (deleteImageIds) {
      parsedDeleteImageIds = JSON.parse(deleteImageIds);
    }

    if (reorderImages) {
      parsedReorderImages = JSON.parse(reorderImages);
    }

    if (newImageOrder) {
      parsedNewImageOrder = JSON.parse(newImageOrder);
    }
  } catch {
    throw new ApiError(400, "Invalid JSON in image operations payload");
  }

  const updatedVariant = await updateProductVariantService({
    variantId: id,
    variantPayload,
    newImages: uploadImages,
    deleteImageIds: parsedDeleteImageIds,
    reorderImages: parsedReorderImages,
    newImageOrder: parsedNewImageOrder,
    coverImageIndex,
    coverImageId,
  });

  const { beforeProductVariant, images, ...afterProductVariant } =
    updatedVariant;

  addToAuditLog(
    "UPDATE",
    beforeProductVariant,
    afterProductVariant,
    user?.userId,
    id,
    "Product_Variant",
  );

  res
    .status(200)
    .json(new ApiResponse(200, updatedVariant, "Variant updated successfully"));
};

export const deleteProductVariantController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params;
  const user = req.user;

  if (!id) {
    throw new ApiError(400, "Product Variant ID is required");
  }

  const productVariant = await deleteProductVariantService(id);

  addToAuditLog(
    "DELETE",
    productVariant,
    null,
    user?.userId,
    id,
    "Product_Variant",
  );

  res.send(new ApiResponse(200, [], "Variant deleted successfully"));
};
