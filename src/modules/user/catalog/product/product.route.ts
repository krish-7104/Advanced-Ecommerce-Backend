import express from "express";
import {
  getProductByIdController,
  getAllProductsController,
} from "./product.controller.js";

const router = express.Router();

router.get("/", getAllProductsController);
router.get("/:id", getProductByIdController);

export default router;
