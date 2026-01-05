import { ProductVariantModel } from "../../../../../generated/prisma/models";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { uploadFileHandler } from "../../../../utils/upload-handlers/upload-file-handler";
import { AssetOwner } from "../../../../../generated/prisma/browser";
import { addAssetToPayload } from "../../../../utils/upload-handlers/add-asset-to-payload";
import { UpdateVariantInputTypes } from "./product-variant.types";
import fs from "fs";

export const createProductVariantService = async (
  payload: ProductVariantModel,
  productId: string,
  images: Express.Multer.File[],
  coverImageIndex: number
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
      images.map((image: any, index: number) =>
        uploadFileHandler(
          image,
          Product.id,
          AssetOwner.PRODUCT_IMAGE,
          index,
          index === coverImageIndex ? true : false
        )
      )
    );

    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllProductVariantsService = async () => {
  try {
    const productVariants = await prisma.productVariant.findMany({
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
  coverImageIndex,
  coverImageId,
}: UpdateVariantInputTypes) => {
  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new ApiError(404, "Product Variant not found");
    }

    if (variantPayload.sku && variantPayload.sku !== variant.sku) {
      const exists = await tx.productVariant.findFirst({
        where: {
          sku: variantPayload.sku,
          NOT: { id: variantId },
        },
      });
      if (exists) throw new ApiError(400, "SKU already exists");
    }

    if (variantPayload.isDefault === true) {
      await tx.productVariant.updateMany({
        where: {
          productId: variant.productId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const updatedVariant = await tx.productVariant.update({
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

    if (deleteImageIds?.length) {
      const assets = await tx.asset.findMany({
        where: {
          id: { in: deleteImageIds },
          ownerId: variantId,
          assetOwner: AssetOwner.PRODUCT_IMAGE,
        },
      });

      for (const asset of assets) {
        if (fs.existsSync(asset.path)) fs.unlinkSync(asset.path);
        await tx.asset.delete({ where: { id: asset.id } });
      }
    }

    if (reorderImages?.length) {
      await Promise.all(
        reorderImages.map((img) =>
          tx.asset.update({
            where: { id: img.id },
            data: { order: img.order },
          })
        )
      );
    }

    if (coverImageId || coverImageIndex !== undefined) {
      await tx.asset.updateMany({
        where: {
          ownerId: variantId,
          assetOwner: AssetOwner.PRODUCT_IMAGE,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    if (newImages?.length) {
      await Promise.all(
        newImages.map((image, index) =>
          uploadFileHandler(
            image,
            variantId,
            AssetOwner.PRODUCT_IMAGE,
            newImageOrder?.[index] ?? 0,
            coverImageId ? false : index === coverImageIndex
          )
        )
      );
    }

    if (coverImageId) {
      const asset = await tx.asset.findFirst({
        where: {
          id: coverImageId,
          ownerId: variantId,
          assetOwner: AssetOwner.PRODUCT_IMAGE,
        },
      });

      if (!asset) {
        throw new ApiError(400, "Invalid cover image");
      }

      await tx.asset.update({
        where: { id: coverImageId },
        data: { isPrimary: true },
      });
    }

    const primaryExists = await tx.asset.findFirst({
      where: {
        ownerId: variantId,
        assetOwner: AssetOwner.PRODUCT_IMAGE,
        isPrimary: true,
      },
    });

    if (!primaryExists) {
      const fallback = await tx.asset.findFirst({
        where: {
          ownerId: variantId,
          assetOwner: AssetOwner.PRODUCT_IMAGE,
        },
        orderBy: { order: "asc" },
      });

      if (fallback) {
        await tx.asset.update({
          where: { id: fallback.id },
          data: { isPrimary: true },
        });
      }
    }

    const assets = await tx.asset.findMany({
      where: {
        ownerId: variantId,
        assetOwner: AssetOwner.PRODUCT_IMAGE,
      },
      orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
    });

    return {
      ...updatedVariant,
      images: assets,
    };
  });
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

    await prisma.asset.deleteMany({
      where: {
        ownerId: deletedVariant.id,
        assetOwner: AssetOwner.PRODUCT_IMAGE,
      },
    });

    return deletedVariant;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};
