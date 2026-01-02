import { ProductVariantModel } from "../../../../generated/prisma/models";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { uploadFileHandler } from "../../../utils/upload-handlers/upload-file-handler";
import { AssetOwner } from "../../../../generated/prisma/browser";
import { addAssetToPayload } from "../../../utils/upload-handlers/add-asset-to-payload";

export const createProductVariantService = async (
  payload: ProductVariantModel,
  productId: string,
  images: Express.Multer.File[]
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
      images?.map((image: any) =>
        uploadFileHandler(image, Product.id, AssetOwner.PRODUCT_IMAGE)
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

export const updateProductVariantService = async (
  id: string,
  payload: Partial<ProductVariantModel>,
  images?: Express.Multer.File[]
) => {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new ApiError(404, "Product Variant not found");
    }

    // SKU uniqueness check
    if (payload.sku && payload.sku !== variant.sku) {
      const skuExists = await prisma.productVariant.findFirst({
        where: {
          sku: payload.sku,
          NOT: { id },
        },
      });

      if (skuExists) {
        throw new ApiError(400, "SKU already exists");
      }
    }

    // If setting default → unset others
    if (payload.isDefault === true) {
      await prisma.productVariant.updateMany({
        where: {
          productId: variant.productId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        sku: payload.sku,
        attributes: payload.attributes ?? undefined,
        price: payload.price,
        mrp: payload.mrp ?? null,
        stockAvailable: payload.stockAvailable,
        isActive: payload.isActive,
        isDefault: payload.isDefault,
      },
    });

    // Upload new images if provided
    if (Array.isArray(images) && images.length > 0) {
      await Promise.all(
        images.map((image) =>
          uploadFileHandler(image, id, AssetOwner.PRODUCT_IMAGE)
        )
      );
    }

    const assetPayload = await addAssetToPayload(
      updatedVariant.id,
      AssetOwner.PRODUCT_IMAGE,
      true
    );

    return { ...updatedVariant, ...assetPayload };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
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
