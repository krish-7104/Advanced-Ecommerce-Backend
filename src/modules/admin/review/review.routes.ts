import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware";
import { checkPermission } from "../../../middlewares/rbac.middleware";
import {
  getAllReviewsAdminController,
  toggleReviewVisibilityController,
  deleteReviewAdminController,
} from "./review.controller";

const router = express.Router();

router.get(
  "/",
  adminAuthMiddleware,
  checkPermission("reviews.view"),
  getAllReviewsAdminController,
);
router.patch(
  "/:reviewId/visibility",
  adminAuthMiddleware,
  checkPermission("reviews.update"),
  toggleReviewVisibilityController,
);
router.delete(
  "/:reviewId",
  adminAuthMiddleware,
  checkPermission("reviews.delete"),
  deleteReviewAdminController,
);

export default router;
