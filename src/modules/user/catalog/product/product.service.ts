import { Prisma } from "../../../../../generated/prisma/browser";
import { AssetOwner } from "../../../../../generated/prisma/enums";
import ApiError from "../../../../utils/ApiError";
import { prisma } from "../../../../utils/prisma";
import { addAssetToPayload } from "../../../../utils/upload-handlers/add-asset-to-payload";
import { GetAllProductsQueryParams } from "./product.types";

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

export const getAllProductsService = async ({
  page,
  limit,
  featured,
  search,
}: GetAllProductsQueryParams) => {
  try {
    const shouldPaginate =
      typeof page === "number" && typeof limit === "number";

    const safePage = shouldPaginate ? Math.max(page, 1) : undefined;
    const safeLimit = shouldPaginate ? Math.max(limit, 1) : undefined;

    const skip =
      shouldPaginate && safePage && safeLimit
        ? (safePage - 1) * safeLimit
        : undefined;

    const productWhere: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (typeof featured === "boolean") {
      productWhere.isFeatured = featured;
    }

    if (search) {
      productWhere.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const where: Prisma.ProductVariantWhereInput = {
      isActive: true,
      isDefault: true,
      product: productWhere,
    };

    const [products, total] = await Promise.all([
      prisma.productVariant.findMany({
        skip,
        take: safeLimit,
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          sku: true,
          price: true,
          mrp: true,
          stockAvailable: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),

      shouldPaginate
        ? prisma.productVariant.count({ where })
        : Promise.resolve(null),
    ]);

    const images = await Promise.all(
      products.map((p) =>
        addAssetToPayload(p.id, AssetOwner.PRODUCT_IMAGE, true)
      )
    );

    const data = products.map((product, index) => {
      const price = Number(product.price);
      const mrp = product.mrp ? Number(product.mrp) : null;

      const hasDiscount = mrp !== null && mrp > price;

      return {
        ...product,
        hasDiscount,
        discountPercentage: hasDiscount
          ? Math.round(((mrp! - price) / mrp!) * 100)
          : null,
        image: images[index]?.images?.[0] ?? null,
      };
    });

    return {
      data,
      pagination: shouldPaginate
        ? {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil((total ?? 0) / safeLimit!),
          }
        : null,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};
