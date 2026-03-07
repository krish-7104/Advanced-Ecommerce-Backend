import { Request, Response } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getAllReviewsAdminService,
  toggleReviewVisibilityService,
} from "./review.service";

export const getAllReviewsAdminController = async (
  req: Request,
  res: Response,
) => {
  const { page, limit } = req.query;
  const result = await getAllReviewsAdminService({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Reviews fetched Successfully"));
};

export const toggleReviewVisibilityController = async (
  req: Request,
  res: Response,
) => {
  const { reviewId } = req.params;
  const review = await toggleReviewVisibilityService(reviewId);

  res
    .status(200)
    .json(
      new ApiResponse(200, review, "Review visibility toggled Successfully"),
    );
};
