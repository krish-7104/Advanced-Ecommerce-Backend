import express from "express";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  createCategoryController,
  getAllCategorieController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "./category.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAllCategorieController);
router.post("", authMiddleware, limitToAdmin, createCategoryController);
router.get("/:id", authMiddleware, getCategoryByIdController);
router.patch("/:id", authMiddleware, limitToAdmin, updateCategoryController);
router.delete("/:id", authMiddleware, limitToAdmin, deleteCategoryController);

export default router;
