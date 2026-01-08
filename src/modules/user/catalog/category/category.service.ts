import { AssetOwner } from "../../../../../generated/prisma/enums";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { addAssetToPayload } from "../../../../utils/upload-handlers/add-asset-to-payload";
import { GetAllCategoriesQueryParams } from "./category.types";

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

    const categoryAsset = await addAssetToPayload(
      category.id,
      AssetOwner.CATEGORY_IMAGE,
      true
    );

    return { ...category, image: categoryAsset?.images?.[0] || null };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllCategoriesService = async (
  queryParams: GetAllCategoriesQueryParams
) => {
  try {
    const { level } = queryParams;

    const where: any = {};

    if (level) {
      where.level = Number(level);
    }

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

    const payload = await Promise.all(
      category.map((category: any) => {
        return addAssetToPayload(category.id, AssetOwner.CATEGORY_IMAGE, true);
      })
    );

    return category.map((category: any, index: number) => ({
      ...category,
      image: payload[index]?.images?.[0] || null,
    }));
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
