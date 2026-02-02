import express from "express";
import {
  getProductByIdController,
  getAllProductsController,
  getProductBySlugController,
} from "./product.controller.js";

const router = express.Router();

router.get("/", getAllProductsController);
router.get("/slug/:slug", getProductBySlugController);
router.get("/:id", getProductByIdController);

export default router;

