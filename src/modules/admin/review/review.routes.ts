import express from "express";
import {
  getAllReviewsAdminController,
  toggleReviewVisibilityController,
  deleteReviewAdminController,
} from "./review.controller";

const router = express.Router();

router.get("/", getAllReviewsAdminController);
router.patch("/:reviewId/visibility", toggleReviewVisibilityController);
router.delete("/:reviewId", deleteReviewAdminController);

export default router;
