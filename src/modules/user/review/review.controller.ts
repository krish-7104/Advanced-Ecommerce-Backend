import { Request, Response } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import {
  addReviewToVariantService,
  getVariantReviewsService,
  getUserReviewsService,
  updateReviewService,
  deleteReviewService,
} from "./review.service";

export const addReviewToVariantController = async (
  req: Request,
  res: Response,
) => {
  const { variantId } = req.params;
  const user = req.user;

  const review = await addReviewToVariantService(
    variantId,
    user?.userId!,
    req.body,
  );

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review added Successfully"));
};

export const getVariantReviewsController = async (
  req: Request,
  res: Response,
) => {
  const { variantId } = req.params;

  const reviews = await getVariantReviewsService(variantId);

  res
    .status(200)
    .json(new ApiResponse(200, reviews, "Reviews fetched Successfully"));
};

export const getUserReviewsController = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const reviews = await getUserReviewsService(userId!);

  res
    .status(200)
    .json(new ApiResponse(200, reviews, "User reviews fetched Successfully"));
};

export const updateReviewController = async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const userId = req.user?.userId;

  const review = await updateReviewService(reviewId, userId!, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, review, "Review updated Successfully"));
};

export const deleteReviewController = async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const userId = req.user?.userId;

  await deleteReviewService(reviewId, userId!);

  res
    .status(200)
    .json(new ApiResponse(200, null, "Review deleted Successfully"));
};
