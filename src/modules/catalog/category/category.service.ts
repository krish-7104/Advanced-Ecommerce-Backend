import { CategoryModel } from "../../../../generated/prisma/models";
import ApiError from "../../../utils/ApiError";
import { toBool } from "../../../utils/common-functions";
import { prisma } from "../../../utils/prisma";
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

export const getAllCategorieService = async (
  queryParams: GetAllCategoriesQueryParams
) => {
  const {
    children,
    childrenCount,
    level,
    parent,
    parentId,
    productCount,
    products,
  } = queryParams;

  try {
    const include: any = {};

    if (toBool(children)) {
      include.children = {};

      if (toBool(products)) {
        include.children.include = {
          products: true,
        };
      }
    }

    if (toBool(parent)) {
      include.parent = true;
    }

    if (toBool(childrenCount) || toBool(productCount)) {
      include._count = { select: {} };

      if (toBool(childrenCount)) {
        include._count.select.children = true;
      }

      if (toBool(productCount)) {
        include._count.select.products = true;
      }
    }

    const where: any = {};

    if (level !== undefined) {
      where.level = Number(level);
    }

    if (parentId) {
      where.parentId = parentId;
    }

    const category = await prisma.category.findMany({
      where,
      ...(Object.keys(include).length ? { include } : {}),
    });

    return category;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getCategoryByIdService = async (categoryId: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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
  categoryId: string,
  payload: CategoryModel
) => {
  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: payload,
    });
    return category;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteCategoryService = async (categoryId: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new ApiError(404, "Category not found!");
    }

    const result = await prisma.category.delete({
      where: { id: categoryId },
    });

    return result;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
