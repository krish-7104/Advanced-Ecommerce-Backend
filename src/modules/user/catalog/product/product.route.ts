import express from "express";
import {
  getProductByIdController,
  getAllProductsController,
  getProductBySlugController,
  getProductsByCategorySlugController,
} from "./product.controller.js";

const router = express.Router();

router.get("/", getAllProductsController);
router.get("/slug/:slug", getProductBySlugController);
router.get("/:id", getProductByIdController);
router.get("/category/:slug", getProductsByCategorySlugController);

export default router;
