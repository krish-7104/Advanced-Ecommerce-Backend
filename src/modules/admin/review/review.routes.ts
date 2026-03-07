import express from "express";
import {
  getAllReviewsAdminController,
  toggleReviewVisibilityController,
} from "./review.controller";

const router = express.Router();

router.get("/", getAllReviewsAdminController);
router.patch("/:reviewId/visibility", toggleReviewVisibilityController);

export default router;
