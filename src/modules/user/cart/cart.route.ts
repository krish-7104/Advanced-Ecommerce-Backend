import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeFromCartController,
  clearCartController,
} from "./cart.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getCartController);
router.post("/", authMiddleware, addToCartController);
router.patch("/:id", authMiddleware, updateCartItemController);
router.delete("/:id", authMiddleware, removeFromCartController);
router.delete("/", authMiddleware, clearCartController);

export default router;
