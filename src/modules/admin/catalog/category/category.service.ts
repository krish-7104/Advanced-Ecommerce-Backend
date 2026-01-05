import { CategoryModel } from "../../../../../generated/prisma/models";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { GetAllCategoriesQueryParams } from "./category.types";

export const createCategorySerice = async (payload: CategoryModel) => {
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
    return category;
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

    return category;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateCategoryService = async (
  id: string,
  payload: CategoryModel
) => {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: payload,
    });
    return category;
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

    const result = await prisma.category.delete({
      where: { id },
    });

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllCategoriesService = async (
  queryParams: GetAllCategoriesQueryParams
) => {
  const { type } = queryParams;

  try {
    const where: any = {};

    if (type === "PARENT") {
      where.parentId = null;
    }

    if (type === "CHILD") {
      where.parentId = { not: null };
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

    return category;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
