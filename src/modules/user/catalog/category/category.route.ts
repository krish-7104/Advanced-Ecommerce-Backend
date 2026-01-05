import express from "express";
import { getAllCategoriesController } from "./category.controller.js";
import { getCategoryByIdController } from "./category.controller.js";

const router = express.Router();

router.get("/", getAllCategoriesController);
router.get("/:id", getCategoryByIdController);

export default router;
