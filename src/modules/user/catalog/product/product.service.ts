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
        variants: {
          include: {
            reviews: {
              where: { isVisible: true },
              include: { votes: true },
            },
          },
        },
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

export const getProductBySlugService = async (slug: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            price: true,
            mrp: true,
            stockAvailable: true,
            isDefault: true,
            attributes: true,
            createdAt: true,
            reviews: {
              where: { isVisible: true },
              include: { votes: true },
            },
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!product) {
      throw new ApiError(404, "Product not found!");
    }

    // Fetch images for all variants
    const variantImages = await Promise.all(
      product.variants.map((variant) =>
        addAssetToPayload(variant.id, AssetOwner.PRODUCT_IMAGE, false),
      ),
    );

    // Map variants with images and discount info
    const variantsWithDetails = product.variants.map((variant, index) => {
      const price = Number(variant.price);
      const mrp = variant.mrp ? Number(variant.mrp) : null;
      const hasDiscount = mrp !== null && mrp > price;

      return {
        ...variant,
        attributes:
          typeof variant.attributes === "string"
            ? JSON.parse(variant.attributes)
            : variant.attributes || {},
        hasDiscount,
        discountPercentage: hasDiscount
          ? Math.round(((mrp! - price) / mrp!) * 100)
          : null,
        images: variantImages[index]?.images ?? [],
        image: variantImages[index]?.images?.[0] ?? null,
      };
    });

    return {
      ...product,
      attributesSchema:
        typeof product.attributesSchema === "string"
          ? JSON.parse(product.attributesSchema)
          : product.attributesSchema || {},
      variants: variantsWithDetails,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};

export const getAllProductsService = async ({
  page,
  limit,
  featured,
  search,
  categoryId,
  minPrice,
  maxPrice,
  inStock,
  sort,
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

    if (categoryId) {
      productWhere.categoryId = categoryId;
    }

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

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (inStock === true) {
      where.stockAvailable = { gt: 0 };
    }

    let orderBy: Prisma.ProductVariantOrderByWithRelationInput | Prisma.ProductVariantOrderByWithRelationInput[] = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "name") orderBy = { product: { name: "asc" } };

    const [products, total] = await Promise.all([
      prisma.productVariant.findMany({
        skip,
        take: safeLimit,
        where,
        orderBy,
        select: {
          id: true,
          sku: true,
          price: true,
          mrp: true,
          stockAvailable: true,
          createdAt: true,
          reviews: {
            where: { isVisible: true },
            include: { votes: true },
          },
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
        addAssetToPayload(p.id, AssetOwner.PRODUCT_IMAGE, true),
      ),
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

export const getProductsByCategorySlugService = async (slug: string) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        category: {
          parent: {
            slug: slug,
          },
        },
      },
      include: {
        category: true,
        variants: {
          include: {
            reviews: {
              where: { isVisible: true },
              include: { votes: true },
            },
          },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
    });

    if (!products.length) {
      throw new ApiError(404, "Products not found!");
    }

    const formattedProducts = await Promise.all(
      products.map(async (product) => {
        const assetsPayload = await addAssetToPayload(
          product.id,
          AssetOwner.PRODUCT_IMAGE,
          true,
        );

        return {
          ...product,
          ...assetsPayload,
          attributesSchema:
            typeof product.attributesSchema === "string"
              ? JSON.parse(product.attributesSchema)
              : product.attributesSchema || {},
        };
      }),
    );

    return formattedProducts;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
