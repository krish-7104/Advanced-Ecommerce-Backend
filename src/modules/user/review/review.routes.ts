import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import {
  addReviewToVariantController,
  getVariantReviewsController,
  getUserReviewsController,
  updateReviewController,
  deleteReviewController,
} from "./review.controller";

const router = express.Router();

router.post("/:variantId", authMiddleware, addReviewToVariantController);
router.get("/variant/:variantId", getVariantReviewsController);
router.get("/mine", authMiddleware, getUserReviewsController);
router.patch("/:reviewId", authMiddleware, updateReviewController);
router.delete("/:reviewId", authMiddleware, deleteReviewController);

export default router;
