import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { AssetOwner } from "../../../../generated/prisma/enums";
import { addAssetToPayload } from "../../../utils/upload-handlers/add-asset-to-payload";
import { AddToWishlistPayload } from "./wishlist.types";

export const getWishlistService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const wishlistItems = await prisma.cartItem.findMany({
      where: {
        userId,
        status: "WISHLISTED",
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const images = await Promise.all(
      wishlistItems.map((item) =>
        addAssetToPayload(item.variant.id, AssetOwner.PRODUCT_IMAGE, true)
      )
    );

    const data = wishlistItems.map((item, index) => {
      const price = Number(item.variant.price);
      const mrp = item.variant.mrp ? Number(item.variant.mrp) : null;
      const hasDiscount = mrp !== null && mrp > price;

      return {
        id: item.id,
        variantId: item.variantId,
        createdAt: item.createdAt,
        variant: {
          id: item.variant.id,
          sku: item.variant.sku,
          price,
          mrp,
          hasDiscount,
          discountPercentage: hasDiscount
            ? Math.round(((mrp! - price) / mrp!) * 100)
            : null,
          stockAvailable: item.variant.stockAvailable,
          isActive: item.variant.isActive,
          attributes: item.variant.attributes,
          product: {
            id: item.variant.product.id,
            name: item.variant.product.name,
            slug: item.variant.product.slug,
            description: item.variant.product.description,
            category: item.variant.product.category,
          },
          image: images[index]?.images?.[0] ?? null,
        },
      };
    });

    return {
      items: data,
      itemCount: data.length,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const addToWishlistService = async (
  payload: AddToWishlistPayload,
  userId: string
) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    if (!payload.variantId) {
      throw new ApiError(400, "Variant ID is required");
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: payload.variantId },
      include: {
        product: true,
      },
    });

    if (!variant) {
      throw new ApiError(404, "Product variant not found");
    }

    const existingWishlistItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId: payload.variantId,
        },
      },
    });

    if (existingWishlistItem) {
      if (existingWishlistItem.status === "WISHLISTED") {
        throw new ApiError(400, "Item already exists in wishlist");
      }
      
      const wishlistItem = await prisma.cartItem.update({
        where: { id: existingWishlistItem.id },
        data: {
          status: "WISHLISTED",
          quantity: 1,
        },
        include: {
          variant: {
            include: {
              product: {
                include: {
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
          },
        },
      });

      const imageData = await addAssetToPayload(
        wishlistItem.variant.id,
        AssetOwner.PRODUCT_IMAGE,
        true
      );

      const price = Number(wishlistItem.variant.price);
      const mrp = wishlistItem.variant.mrp
        ? Number(wishlistItem.variant.mrp)
        : null;
      const hasDiscount = mrp !== null && mrp > price;

      return {
        id: wishlistItem.id,
        variantId: wishlistItem.variantId,
        createdAt: wishlistItem.createdAt,
        variant: {
          id: wishlistItem.variant.id,
          sku: wishlistItem.variant.sku,
          price,
          mrp,
          hasDiscount,
          discountPercentage: hasDiscount
            ? Math.round(((mrp! - price) / mrp!) * 100)
            : null,
          stockAvailable: wishlistItem.variant.stockAvailable,
          isActive: wishlistItem.variant.isActive,
          attributes: wishlistItem.variant.attributes,
          product: {
            id: wishlistItem.variant.product.id,
            name: wishlistItem.variant.product.name,
            slug: wishlistItem.variant.product.slug,
            description: wishlistItem.variant.product.description,
            category: wishlistItem.variant.product.category,
          },
          image: imageData?.images?.[0] ?? null,
        },
      };
    }

    const wishlistItem = await prisma.cartItem.create({
      data: {
        userId,
        variantId: payload.variantId,
        quantity: 1,
        status: "WISHLISTED",
      },
      include: {
        variant: {
          include: {
            product: {
              include: {
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
        },
      },
    });

    const imageData = await addAssetToPayload(
      wishlistItem.variant.id,
      AssetOwner.PRODUCT_IMAGE,
      true
    );

    const price = Number(wishlistItem.variant.price);
    const mrp = wishlistItem.variant.mrp
      ? Number(wishlistItem.variant.mrp)
      : null;
    const hasDiscount = mrp !== null && mrp > price;

    return {
      id: wishlistItem.id,
      variantId: wishlistItem.variantId,
      createdAt: wishlistItem.createdAt,
      variant: {
        id: wishlistItem.variant.id,
        sku: wishlistItem.variant.sku,
        price,
        mrp,
        hasDiscount,
        discountPercentage: hasDiscount
          ? Math.round(((mrp! - price) / mrp!) * 100)
          : null,
        stockAvailable: wishlistItem.variant.stockAvailable,
        isActive: wishlistItem.variant.isActive,
        attributes: wishlistItem.variant.attributes,
        product: {
          id: wishlistItem.variant.product.id,
          name: wishlistItem.variant.product.name,
          slug: wishlistItem.variant.product.slug,
          description: wishlistItem.variant.product.description,
          category: wishlistItem.variant.product.category,
        },
        image: imageData?.images?.[0] ?? null,
      },
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const removeFromWishlistService = async (
  wishlistItemId: string,
  userId: string
) => {
  try {
    if (!wishlistItemId) {
      throw new ApiError(400, "Wishlist item ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const wishlistItem = await prisma.cartItem.findUnique({
      where: { id: wishlistItemId },
    });

    if (!wishlistItem) {
      throw new ApiError(404, "Wishlist item not found");
    }

    if (wishlistItem.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to remove this wishlist item"
      );
    }

    if (wishlistItem.status !== "WISHLISTED") {
      throw new ApiError(400, "Item is not in wishlist");
    }

    await prisma.cartItem.delete({
      where: { id: wishlistItemId },
    });

    return { message: "Item removed from wishlist successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const removeFromWishlistByVariantService = async (
  variantId: string,
  userId: string
) => {
  try {
    if (!variantId) {
      throw new ApiError(400, "Variant ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const wishlistItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId,
        },
      },
    });

    if (!wishlistItem) {
      throw new ApiError(404, "Wishlist item not found");
    }

    if (wishlistItem.status !== "WISHLISTED") {
      throw new ApiError(400, "Item is not in wishlist");
    }

    await prisma.cartItem.delete({
      where: { id: wishlistItem.id },
    });

    return { message: "Item removed from wishlist successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const clearWishlistService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    await prisma.cartItem.deleteMany({
      where: {
        userId,
        status: "WISHLISTED",
      },
    });

    return { message: "Wishlist cleared successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
