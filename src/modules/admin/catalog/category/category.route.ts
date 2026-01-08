import express from "express";
import { limitToAdmin } from "../../../../middlewares/limit-to-admin.middleware.js";
import { authMiddleware } from "../../../../middlewares/auth.middleware.js";
import {
  createCategoryController,
  getAllCategoriesController,
  getCategoryByIdController,
  updateCategoryController,
  deleteCategoryController,
} from "./category.controller.js";
import { upload } from "../../../../utils/upload-handlers/multer.js";
import { parseFormData } from "../../../../middlewares/parse-formdata.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllCategoriesController);
router.post(
  "",
  authMiddleware,
  limitToAdmin,
  upload("category").single("image"),
  parseFormData,
  createCategoryController
);
router.get("/:id", authMiddleware, getCategoryByIdController);
router.patch(
  "/:id",
  authMiddleware,
  limitToAdmin,
  upload("category").single("image"),
  parseFormData,
  updateCategoryController
);
router.delete("/:id", authMiddleware, limitToAdmin, deleteCategoryController);

export default router;
