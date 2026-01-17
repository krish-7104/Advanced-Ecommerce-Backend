import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import { AssetOwner } from "../../../../generated/prisma/enums";
import { addAssetToPayload } from "../../../utils/upload-handlers/add-asset-to-payload";
import {
  AddToCartPayload,
  AddToWishlistPayload,
  UpdateCartItemPayload,
} from "./cart.types";

export const getCartService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
        status: "ACTIVE",
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
      cartItems.map((item) =>
        addAssetToPayload(item.variant.id, AssetOwner.PRODUCT_IMAGE, true)
      )
    );

    const data = cartItems.map((item, index) => {
      const price = Number(item.variant.price);
      const mrp = item.variant.mrp ? Number(item.variant.mrp) : null;
      const hasDiscount = mrp !== null && mrp > price;

      return {
        id: item.id,
        variantId: item.variantId,
        quantity: item.quantity,
        status: item.status,
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
        subtotal: price * item.quantity,
      };
    });

    const total = data.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items: data,
      total,
      itemCount: data.length,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const addToCartService = async (
  payload: AddToCartPayload,
  userId: string
) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    if (!payload.variantId) {
      throw new ApiError(400, "Variant ID is required");
    }

    if (!payload.quantity || payload.quantity < 1) {
      throw new ApiError(400, "Quantity must be at least 1");
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

    if (!variant.isActive) {
      throw new ApiError(400, "Product variant is not available");
    }

    if (variant.stockAvailable < payload.quantity) {
      throw new ApiError(
        400,
        `Only ${variant.stockAvailable} items available in stock`
      );
    }

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId: payload.variantId,
        },
      },
    });

    let cartItem;

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + payload.quantity;

      if (variant.stockAvailable < newQuantity) {
        throw new ApiError(
          400,
          `Only ${variant.stockAvailable} items available in stock`
        );
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: newQuantity,
          status: "ACTIVE",
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
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          variantId: payload.variantId,
          quantity: payload.quantity,
          status: "ACTIVE",
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
    }

    const imageData = await addAssetToPayload(
      cartItem.variant.id,
      AssetOwner.PRODUCT_IMAGE,
      true
    );

    const price = Number(cartItem.variant.price);
    const mrp = cartItem.variant.mrp ? Number(cartItem.variant.mrp) : null;
    const hasDiscount = mrp !== null && mrp > price;

    return {
      id: cartItem.id,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      status: cartItem.status,
      variant: {
        id: cartItem.variant.id,
        sku: cartItem.variant.sku,
        price,
        mrp,
        hasDiscount,
        discountPercentage: hasDiscount
          ? Math.round(((mrp! - price) / mrp!) * 100)
          : null,
        stockAvailable: cartItem.variant.stockAvailable,
        attributes: cartItem.variant.attributes,
        product: {
          id: cartItem.variant.product.id,
          name: cartItem.variant.product.name,
          slug: cartItem.variant.product.slug,
          description: cartItem.variant.product.description,
          category: cartItem.variant.product.category,
        },
        image: imageData?.images?.[0] ?? null,
      },
      subtotal: price * cartItem.quantity,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateCartItemService = async (
  cartItemId: string,
  payload: UpdateCartItemPayload,
  userId: string
) => {
  try {
    if (!cartItemId) {
      throw new ApiError(400, "Cart item ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      throw new ApiError(404, "Cart item not found");
    }

    if (cartItem.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to update this cart item"
      );
    }

    const updateData: any = {};

    if (payload.quantity !== undefined) {
      if (payload.quantity < 1) {
        throw new ApiError(400, "Quantity must be at least 1");
      }

      if (cartItem.variant.stockAvailable < payload.quantity) {
        throw new ApiError(
          400,
          `Only ${cartItem.variant.stockAvailable} items available in stock`
        );
      }

      updateData.quantity = payload.quantity;
    }

    if (payload.status !== undefined) {
      updateData.status = payload.status;
    }

    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: updateData,
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
      updatedCartItem.variant.id,
      AssetOwner.PRODUCT_IMAGE,
      true
    );

    const price = Number(updatedCartItem.variant.price);
    const mrp = updatedCartItem.variant.mrp
      ? Number(updatedCartItem.variant.mrp)
      : null;
    const hasDiscount = mrp !== null && mrp > price;

    return {
      id: updatedCartItem.id,
      variantId: updatedCartItem.variantId,
      quantity: updatedCartItem.quantity,
      status: updatedCartItem.status,
      variant: {
        id: updatedCartItem.variant.id,
        sku: updatedCartItem.variant.sku,
        price,
        mrp,
        hasDiscount,
        discountPercentage: hasDiscount
          ? Math.round(((mrp! - price) / mrp!) * 100)
          : null,
        stockAvailable: updatedCartItem.variant.stockAvailable,
        attributes: updatedCartItem.variant.attributes,
        product: {
          id: updatedCartItem.variant.product.id,
          name: updatedCartItem.variant.product.name,
          slug: updatedCartItem.variant.product.slug,
          description: updatedCartItem.variant.product.description,
          category: updatedCartItem.variant.product.category,
        },
        image: imageData?.images?.[0] ?? null,
      },
      subtotal: price * updatedCartItem.quantity,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const removeFromCartService = async (
  cartItemId: string,
  userId: string
) => {
  try {
    if (!cartItemId) {
      throw new ApiError(400, "Cart item ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem) {
      throw new ApiError(404, "Cart item not found");
    }

    if (cartItem.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to remove this cart item"
      );
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return { message: "Item removed from cart successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const clearCartService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    await prisma.cartItem.deleteMany({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    return { message: "Cart cleared successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

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
