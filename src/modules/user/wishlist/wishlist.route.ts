import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  getWishlistController,
  addToWishlistController,
  removeFromWishlistController,
  removeFromWishlistByVariantController,
  clearWishlistController,
} from "./wishlist.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getWishlistController);
router.post("/", authMiddleware, addToWishlistController);
router.delete("/:id", authMiddleware, removeFromWishlistController);
router.delete("/variant/:variantId", authMiddleware, removeFromWishlistByVariantController);
router.delete("/", authMiddleware, clearWishlistController);

export default router;
