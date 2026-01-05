import { AssetOwner } from "../../../../../generated/prisma/enums";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { addAssetToPayload } from "../../../../utils/upload-handlers/add-asset-to-payload";

export const getCategoryByIdService = async (id: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: {
          omit: {
            isActive: true,
            updatedAt: true,
            createdAt: true,
          },
          where: {
            isActive: true,
          },
          include: {
            variants: {
              where: {
                isActive: true,
                isDefault: true,
              },
              select: {
                id: true,
                sku: true,
                price: true,
                mrp: true,
                stockAvailable: true,
                attributes: true,
                isDefault: true,
              },
            },
          },
        },
        _count: {
          select: {
            children: {
              where: {
                isActive: true,
              },
            },
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (category?.products?.length === 0) {
      throw new ApiError(404, "Category not found!");
    }

    for (let product of category?.products!) {
      const coverImage = await addAssetToPayload(
        product.variants?.[0]?.id || "",
        AssetOwner.PRODUCT_IMAGE,
        true
      );
      (product as any).coverImage = coverImage?.images?.[0];
    }

    if (!category) {
      throw new ApiError(404, "Category not found!");
    }

    return category;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllCategoriesService = async () => {
  try {
    const where: any = {};

    const category = await prisma.category.findMany({
      where,
      include: {
        parent: true,
        _count: {
          select: {
            children: {
              where: {
                isActive: true,
              },
            },
            products: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    return category;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
