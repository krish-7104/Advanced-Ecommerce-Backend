import express from "express";
import { adminAuthMiddleware } from "../../../../middlewares/admin-auth.middleware.js";
import {
  createProductController,
  getProductByIdController,
  updateProductController,
  deleteProductController,
  getAllProductsController,
} from "./product.controller.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllProductsController);
router.post("/", adminAuthMiddleware, createProductController);
router.get("/:id", adminAuthMiddleware, getProductByIdController);
router.patch("/:id", adminAuthMiddleware, updateProductController);
router.delete("/:id", adminAuthMiddleware, deleteProductController);

export default router;
