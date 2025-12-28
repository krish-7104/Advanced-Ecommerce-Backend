import express from "express";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  createProductController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  getAllProductsController,
} from "./product.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAllProductsController);
router.post("/", authMiddleware, limitToAdmin, createProductController);
router.get("/:id", authMiddleware, getProductByIdController);
router.patch("/:id", authMiddleware, limitToAdmin, updateProductController);
router.delete("/:id", authMiddleware, limitToAdmin, deleteProductController);

export default router;
