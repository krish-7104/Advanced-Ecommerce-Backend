import express from "express";
import { adminAuthMiddleware } from "../../../../middlewares/admin-auth.middleware.js";
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

router.get("/", adminAuthMiddleware, getAllCategoriesController);
router.post(
  "",
  adminAuthMiddleware,
  upload("category").single("image"),
  parseFormData,
  createCategoryController
);
router.get("/:id", adminAuthMiddleware, getCategoryByIdController);
router.patch(
  "/:id",
  adminAuthMiddleware,
  upload("category").single("image"),
  parseFormData,
  updateCategoryController
);
router.delete("/:id", adminAuthMiddleware, deleteCategoryController);

export default router;
