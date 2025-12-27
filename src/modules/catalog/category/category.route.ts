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
router.post("/create", authMiddleware, limitToAdmin, createCategoryController);
router.get("/:categoryId", authMiddleware, getCategoryByIdController);
router.patch(
  "/:categoryId",
  authMiddleware,
  limitToAdmin,
  updateCategoryController
);
router.delete(
  "/:categoryId",
  authMiddleware,
  limitToAdmin,
  deleteCategoryController
);

export default router;
