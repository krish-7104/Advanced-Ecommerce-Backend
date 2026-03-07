import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import {
  addReviewToVariantController,
  getVariantReviewsController,
  getUserReviewsController,
} from "./review.controller";

const router = express.Router();

router.post("/:variantId", authMiddleware, addReviewToVariantController);
router.get("/variant/:variantId", getVariantReviewsController);
router.get("/mine", authMiddleware, getUserReviewsController);

export default router;
