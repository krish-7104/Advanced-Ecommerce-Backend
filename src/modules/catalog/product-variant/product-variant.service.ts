import { ProductModel } from "../../../../generated/prisma/models";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";

export const createProductVariantSerice = async (payload: ProductModel) => {
  try {
    const {
      name,
      description,
      slug,
      attributesSchema,
      brand,
      categoryId,
      isActive,
      isFeatured,
    } = payload;

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
        isActive,
        isFeatured,
      },
    });
    return Product;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
export const getProductVariantByIdService = async (id: string) => {
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

export const updateProductVariantService = async (
  id: string,
  payload: ProductModel
) => {
  try {
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

export const deleteProductVariantService = async (id: string) => {
  try {
    const Product = await prisma.product.findUnique({
      where: { id },
    });

    if (!Product) {
      throw new ApiError(404, "Product not found!");
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

export const getAllProductVariantsService = async () => {
  try {
    return [];
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
