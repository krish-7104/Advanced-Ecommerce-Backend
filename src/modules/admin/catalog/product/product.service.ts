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
      categoryId,
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

    if (attributesSchema) {
      if (
        typeof attributesSchema !== "object" ||
        Array.isArray(attributesSchema)
      ) {
        throw new ApiError(400, "Attributes schema must be an object");
      }
      for (const [key, values] of Object.entries(attributesSchema)) {
        if (!Array.isArray(values)) {
          throw new ApiError(
            400,
            `Attributes schema values for key '${key}' must be an array of strings`,
          );
        }
        if (values.some((v: any) => typeof v !== "string")) {
          throw new ApiError(
            400,
            `Attributes schema values for key '${key}' must be strings`,
          );
        }
      }
    }

    const Product = await prisma.product.create({
      data: {
        name,
        description,
        slug: newSlug,
        attributesSchema: attributesSchema || {},
        categoryId,
        isFeatured,
      },
    });
    return {
      ...Product,
      attributesSchema:
        typeof Product.attributesSchema === "string"
          ? JSON.parse(Product.attributesSchema)
          : Product.attributesSchema || {},
    };
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

    return {
      ...Product,
      attributesSchema:
        typeof Product.attributesSchema === "string"
          ? JSON.parse(Product.attributesSchema)
          : Product.attributesSchema || {},
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateProductService = async (
  id: string,
  payload: ProductModel,
) => {
  const beforeProduct = await prisma.product.findFirst({
    where: {
      id: id,
    },
  });

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
          "Product must have at least one variant to be active",
        );
      }
    }

    const Product = await prisma.product.update({
      where: { id },
      data: { ...payload, attributesSchema: payload.attributesSchema || {} },
    });
    return {
      beforeProduct,
      ...Product,
      attributesSchema:
        typeof Product.attributesSchema === "string"
          ? JSON.parse(Product.attributesSchema)
          : Product.attributesSchema || {},
    };
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
  queryParams: GetAllProductsQueryParams,
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

    const Products = await prisma.product.findMany({
      where,
      include: {
        _count: {
          select: {
            variants: true,
          },
        },
        category: {
          select: {
            parent: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    const payload = await Promise.all(
      Products.map((product: any) => {
        if (product._count.variants > 0) {
          return addAssetToPayload(
            product.variants?.[0]?.id || "",
            AssetOwner.PRODUCT_IMAGE,
            true,
          );
        }
        return null;
      }),
    );

    return Products.map((product: any, index: number) => ({
      ...product,
      attributesSchema:
        typeof product.attributesSchema === "string"
          ? JSON.parse(product.attributesSchema)
          : product.attributesSchema || {},
      ...payload[index],
    }));
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
