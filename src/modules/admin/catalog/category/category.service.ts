import { AssetOwner } from "../../../../../generated/prisma/enums";
import { CategoryModel } from "../../../../../generated/prisma/models";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { uploadFileHandler } from "../../../../utils/upload-handlers/upload-file-handler";
import { GetAllCategoriesQueryParams } from "./category.types";
import fs from "fs";
import { addAssetToPayload } from "../../../../utils/upload-handlers/add-asset-to-payload";
import { deleteCachePattern } from "../../../../utils/redis.js";

export const createCategoryService = async (
  payload: CategoryModel,
  image: Express.Multer.File,
) => {
  try {
    const { name, description, slug, parentId, level } = payload;

    if (parentId) {
      const checkParent = await prisma.category.findUnique({
        where: {
          id: parentId,
        },
      });

      if (!checkParent) {
        throw new ApiError(404, "Parent Category not found!");
      }
    }

    if (name) {
      const checkname = await prisma.category.findFirst({
        where: {
          name: name,
        },
      });

      if (checkname) {
        throw new ApiError(400, "Name with this category already exists!");
      }
    }

    let newSlug = slug;

    if (!slug) {
      newSlug = name.replaceAll(" ", "-").toLowerCase();
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        slug: newSlug,
        parentId: parentId ? (parentId?.length > 0 ? parentId : null) : null,
        level: level || 0,
      },
    });

    const categoryAsset = await uploadFileHandler(
      image,
      category.id,
      AssetOwner.CATEGORY_IMAGE,
      0,
      true,
    );

    await deleteCachePattern("category:*");

    return {
      ...category,
      image: {
        id: categoryAsset.id,
        fileName: categoryAsset.fileName,
        isPrimary: categoryAsset.isPrimary,
        url: `${process.env.MEDIA_URL}/${categoryAsset.path}`,
      },
      afterCreate: category,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
export const getCategoryByIdService = async (id: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        products: true,
        _count: {
          select: { children: true, products: true },
        },
      },
    });

    if (!category) {
      throw new ApiError(404, "Category not found!");
    }

    const categoryAsset = await addAssetToPayload(
      category.id,
      AssetOwner.CATEGORY_IMAGE,
      true,
    );

    return { ...category, image: categoryAsset?.images?.[0] || null };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateCategoryService = async (
  id: string,
  payload: CategoryModel,
  image: Express.Multer.File,
) => {
  const beforeCategory = await prisma.category.findFirst({
    where: {
      id: id,
    },
  });

  const prismaTx = prisma.$transaction.bind(prisma);
  try {
    const result = await prismaTx(async (tx) => {
      // Update category
      const category = await tx.category.update({
        where: { id },
        data: payload,
      });

      // Find the existing asset to get the file path
      const existingAsset = await tx.asset.findFirst({
        where: {
          ownerId: id,
          assetOwner: AssetOwner.CATEGORY_IMAGE,
        },
      });

      // Delete the asset record from the database
      if (existingAsset) {
        await tx.asset.delete({
          where: {
            id: existingAsset.id,
          },
        });
        if (existingAsset.path) {
          if (fs.existsSync(existingAsset.path))
            fs.unlinkSync(existingAsset.path);
        }
      }

      let categoryAsset = null;
      if (image) {
        const uploadedAsset = await uploadFileHandler(
          image,
          category.id,
          AssetOwner.CATEGORY_IMAGE,
          0,
          true,
        );
        categoryAsset = {
          id: uploadedAsset.id,
          fileName: uploadedAsset.fileName,
          isPrimary: uploadedAsset.isPrimary,
          url: `${process.env.MEDIA_URL}/${uploadedAsset.path}`,
        };
      }

      return categoryAsset
        ? {
            ...category,
            image: categoryAsset,
            containsImage: true,
          }
        : {
            ...category,
            image: null,
            containsImage: false,
          };
    });

    await deleteCachePattern("category:*");

    return {
      ...result,
      beforeCategory,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteCategoryService = async (id: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new ApiError(404, "Category not found!");
    }

    const findSubCategories = await prisma.category.findMany({
      where: {
        parentId: id,
      },
    });

    if (findSubCategories.length > 0) {
      throw new ApiError(400, "Category has sub categories, cannot be deleted");
    }

    const result = await prisma.category.delete({
      where: { id },
    });

    await deleteCachePattern("category:*");

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllCategoriesService = async (
  queryParams: GetAllCategoriesQueryParams,
) => {
  const { level } = queryParams;

  try {
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
            children: true,
            products: true,
          },
        },
      },
    });

    const payload = await Promise.all(
      category.map((category: any) => {
        return addAssetToPayload(category.id, AssetOwner.CATEGORY_IMAGE, true);
      }),
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
