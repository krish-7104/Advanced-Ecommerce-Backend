import { AssetOwner } from "../../../../../generated/prisma/enums";
import { ProductModel } from "../../../../../generated/prisma/models";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { addAssetToPayload } from "../../../../utils/upload-handlers/add-asset-to-payload";
import { GetAllProductsQueryParams } from "./product.types";

export const createProductSerice = async (payload: ProductModel) => {
  try {
    const {
      name,
      description,
      slug,
      attributesSchema,
      brand,
      categoryId,
      isFeatured,
    } = payload;

    console.log(payload);

    if (name) {
      const checkname = await prisma.product.findFirst({
        where: {
          name: name,
        },
      });

      if (checkname) {
        throw new ApiError(400, "Name with this Product already exists!");
      }
    }

    let newSlug = slug;

    if (!slug) {
      newSlug = name.replaceAll(" ", "-").toLowerCase();
    }

    const Product = await prisma.product.create({
      data: {
        name,
        description,
        slug: newSlug,
        attributesSchema: attributesSchema || {},
        brand,
        categoryId,
        isFeatured,
      },
    });
    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
export const getProductByIdService = async (id: string) => {
  try {
    const Product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    if (!Product) {
      throw new ApiError(404, "Product not found!");
    }

    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateProductService = async (
  id: string,
  payload: ProductModel
) => {
  try {
    if (payload.isActive === true) {
      const variants = await prisma.productVariant.findMany({
        where: {
          productId: id,
        },
      });
      if (variants.length === 0) {
        throw new ApiError(
          400,
          "Product must have at least one variant to be active"
        );
      }
    }

    const Product = await prisma.product.update({
      where: { id },
      data: { ...payload, attributesSchema: payload.attributesSchema || {} },
    });
    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteProductService = async (id: string) => {
  try {
    const Product = await prisma.product.findUnique({
      where: { id },
    });

    if (!Product) {
      throw new ApiError(404, "Product not found!");
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        productId: id,
      },
    });
    if (variants.length > 0) {
      throw new ApiError(400, "Product has variants, cannot be deleted");
    }

    const result = await prisma.product.delete({
      where: { id },
    });

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllProductsService = async (
  queryParams: GetAllProductsQueryParams
) => {
  const { categoryId, hasVariants, isActive, isFeatured } = queryParams;
  try {
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isActive) {
      where.isActive = isActive == "true" ? true : false;
    }

    if (isFeatured) {
      where.isFeatured = isFeatured === "true" ? true : false;
    }

    if (hasVariants) {
      where.variants = { not: [] };
    }

    const Product = await prisma.product.findMany({
      where,
      include: {
        _count: {
          select: {
            variants: true,
          },
        },
        category: {
          include: {
            parent: true,
          },
        },
        variants: {
          where: {
            isActive: true,
            isDefault: true,
          },
        },
      },
    });

    const payload = await Promise.all(
      Product.map((product: any) =>
        addAssetToPayload(
          product.variants[0]?.id || "",
          AssetOwner.PRODUCT_IMAGE,
          true
        )
      )
    );

    return Product.map((product: any, index: number) => ({
      ...product,
      ...payload[index],
    }));
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
