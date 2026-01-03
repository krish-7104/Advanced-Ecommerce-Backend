import { ProductVariantModel } from "../../../../generated/prisma/models";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { uploadFileHandler } from "../../../utils/upload-handlers/upload-file-handler";
import { AssetOwner } from "../../../../generated/prisma/browser";
import { addAssetToPayload } from "../../../utils/upload-handlers/add-asset-to-payload";
import { UpdateVariantInputTypes } from "./product-variant.types";
import fs from "fs";

export const createProductVariantService = async (
  payload: ProductVariantModel,
  productId: string,
  images: Express.Multer.File[],
  imageSequence: number[]
) => {
  try {
    const { sku, mrp, attributes, isActive, price, stockAvailable, isDefault } =
      payload;

    if (sku) {
      const checkSKU = await prisma.productVariant.findFirst({
        where: {
          sku: sku,
        },
      });

      if (checkSKU) {
        throw new ApiError(
          400,
          "SKU with this Product Variant already exists!"
        );
      }
    }

    const productFoundCheck = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!productFoundCheck) {
      throw new ApiError(404, "Product not found!");
    }

    const Product = await prisma.productVariant.create({
      data: {
        sku,
        attributes: attributes || {},
        price,
        mrp: mrp || null,
        productId,
        isActive,
        stockAvailable,
        isDefault,
      },
    });

    await Promise.all(
      images?.map((image: any, index: number) =>
        uploadFileHandler(
          image,
          Product.id,
          AssetOwner.PRODUCT_IMAGE,
          imageSequence[index]
        )
      )
    );
    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllProductVariantsService = async (productId: string) => {
  try {
    const productVariants = await prisma.productVariant.findMany({
      where: {
        productId: productId,
      },
      include: {
        product: {
          include: {
            category: {
              include: {
                children: true,
              },
            },
          },
          omit: {
            attributesSchema: true,
          },
        },
        _count: {
          select: {
            cartItems: true,
            orderItems: true,
          },
        },
      },
    });

    const payload = await Promise.all(
      productVariants.map((variant: any) =>
        addAssetToPayload(variant.id, AssetOwner.PRODUCT_IMAGE, true)
      )
    );

    return productVariants.map((variant: any, index: number) => ({
      ...variant,
      ...payload[index],
    }));
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getProductVariantByIdService = async (id: string) => {
  try {
    const variantFoundCheck = await prisma.productVariant.findUnique({
      where: {
        id: id,
      },
    });

    if (!variantFoundCheck) {
      throw new ApiError(404, "Product Variant not found!");
    }

    const productVariant = await prisma.productVariant.findUnique({
      where: { id: id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const payload = await addAssetToPayload(
      productVariant?.id || "",
      AssetOwner.PRODUCT_IMAGE
    );
    return { ...productVariant, ...payload };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateProductVariantService = async ({
  variantId,
  variantPayload,
  newImages,
  deleteImageIds,
  reorderImages,
  newImageOrder,
  primaryImageId,
}: UpdateVariantInputTypes) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    throw new ApiError(404, "Product Variant not found");
  }

  if (variantPayload.sku && variantPayload.sku !== variant.sku) {
    const exists = await prisma.productVariant.findFirst({
      where: {
        sku: variantPayload.sku,
        NOT: { id: variantId },
      },
    });

    if (exists) throw new ApiError(400, "SKU already exists");
  }

  if (variantPayload.isDefault === true) {
    await prisma.productVariant.updateMany({
      where: {
        productId: variant.productId,
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  const updatedVariant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      sku: variantPayload.sku,
      price: variantPayload.price,
      mrp: variantPayload.mrp ?? null,
      stockAvailable: variantPayload.stockAvailable,
      isActive: variantPayload.isActive,
      isDefault: variantPayload.isDefault,
      attributes: variantPayload.attributes ?? undefined,
    },
  });

  if (deleteImageIds && deleteImageIds.length > 0) {
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: deleteImageIds },
        ownerId: variantId,
        assetOwner: AssetOwner.PRODUCT_IMAGE,
      },
    });

    await Promise.all(
      assets.map(async (asset) => {
        if (fs.existsSync(asset.path)) {
          fs.unlinkSync(asset.path);
        }
        await prisma.asset.delete({ where: { id: asset.id } });
      })
    );
  }

  if (reorderImages && reorderImages.length > 0) {
    await Promise.all(
      reorderImages.map((img) =>
        prisma.asset.update({
          where: { id: img.id },
          data: { order: img.order },
        })
      )
    );
  }

  if (newImages && newImages.length > 0) {
    await Promise.all(
      newImages.map((image: any, index: number) =>
        uploadFileHandler(
          image,
          variantId,
          AssetOwner.PRODUCT_IMAGE,
          newImageOrder?.[index] ?? 0
        )
      )
    );
  }

  if (primaryImageId) {
    const asset = await prisma.asset.findFirst({
      where: {
        id: primaryImageId,
        ownerId: variantId,
        assetOwner: AssetOwner.PRODUCT_IMAGE,
      },
    });

    if (!asset) {
      throw new ApiError(400, "Invalid primary image");
    }

    await prisma.asset.updateMany({
      where: {
        ownerId: variantId,
        assetOwner: AssetOwner.PRODUCT_IMAGE,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    await prisma.asset.update({
      where: { id: primaryImageId },
      data: { isPrimary: true },
    });
  }

  const assets = await prisma.asset.findMany({
    where: {
      ownerId: variantId,
      assetOwner: AssetOwner.PRODUCT_IMAGE,
    },
    orderBy: { order: "asc" },
  });

  return {
    ...updatedVariant,
    images: assets,
  };
};

export const deleteProductVariantService = async (id: string) => {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new ApiError(404, "Product Variant not found");
    }

    const variantCount = await prisma.productVariant.count({
      where: { productId: variant.productId },
    });

    if (variant.isDefault && variantCount === 1) {
      throw new ApiError(
        400,
        "Cannot delete the only default variant of a product"
      );
    }

    const deletedVariant = await prisma.productVariant.delete({
      where: { id },
    });

    return deletedVariant;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};
