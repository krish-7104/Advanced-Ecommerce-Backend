import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getCartService,
  addToCartService,
  updateCartItemService,
  removeFromCartService,
  clearCartService,
} from "./cart.service";

export const getCartController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const cart = await getCartService(userId);

  return res.send(new ApiResponse(200, cart, "Cart retrieved successfully"));
};

export const addToCartController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const cartItem = await addToCartService(req.body, userId);

  return res.send(
    new ApiResponse(201, cartItem, "Item added to cart successfully")
  );
};

export const updateCartItemController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const cartItemId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!cartItemId) {
    throw new ApiError(400, "Cart item ID is required");
  }

  const cartItem = await updateCartItemService(cartItemId, req.body, userId);

  return res.send(
    new ApiResponse(200, cartItem, "Cart item updated successfully")
  );
};

export const removeFromCartController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const cartItemId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!cartItemId) {
    throw new ApiError(400, "Cart item ID is required");
  }

  await removeFromCartService(cartItemId, userId);

  return res.send(
    new ApiResponse(200, [], "Item removed from cart successfully")
  );
};

export const clearCartController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  await clearCartService(userId);

  return res.send(new ApiResponse(200, [], "Cart cleared successfully"));
};
