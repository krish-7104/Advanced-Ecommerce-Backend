import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getWishlistService,
  addToWishlistService,
  removeFromWishlistService,
  removeFromWishlistByVariantService,
  clearWishlistService,
} from "./cart.service";

export const getWishlistController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const wishlist = await getWishlistService(userId);

  return res.send(
    new ApiResponse(200, wishlist, "Wishlist retrieved successfully")
  );
};

export const addToWishlistController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const wishlistItem = await addToWishlistService(req.body, userId);

  return res.send(
    new ApiResponse(201, wishlistItem, "Item added to wishlist successfully")
  );
};

export const removeFromWishlistController = async (
  req: Request,
  res: Response
) => {
  const userId = req?.user?.userId;
  const wishlistItemId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!wishlistItemId) {
    throw new ApiError(400, "Wishlist item ID is required");
  }

  await removeFromWishlistService(wishlistItemId, userId);

  return res.send(
    new ApiResponse(200, [], "Item removed from wishlist successfully")
  );
};

export const removeFromWishlistByVariantController = async (
  req: Request,
  res: Response
) => {
  const userId = req?.user?.userId;
  const variantId = req.params.variantId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!variantId) {
    throw new ApiError(400, "Variant ID is required");
  }

  await removeFromWishlistByVariantService(variantId, userId);

  return res.send(
    new ApiResponse(200, [], "Item removed from wishlist successfully")
  );
};

export const clearWishlistController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  await clearWishlistService(userId);

  return res.send(new ApiResponse(200, [], "Wishlist cleared successfully"));
};
