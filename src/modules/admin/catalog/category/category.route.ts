import express from "express";
import { adminAuthMiddleware } from "../../../../middlewares/admin-auth.middleware.js";
import { checkPermission } from "../../../../middlewares/rbac.middleware";
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

router.get(
  "/",
  adminAuthMiddleware,
  checkPermission("categories.view"),
  getAllCategoriesController,
);
router.post(
  "",
  adminAuthMiddleware,
  upload("category").single("image"),
  parseFormData,
  checkPermission("categories.create"),
  createCategoryController,
);
router.get(
  "/:id",
  adminAuthMiddleware,
  checkPermission("categories.view"),
  getCategoryByIdController,
);
router.patch(
  "/:id",
  adminAuthMiddleware,
  upload("category").single("image"),
  parseFormData,
  checkPermission("categories.update"),
  updateCategoryController,
);
router.delete(
  "/:id",
  adminAuthMiddleware,
  checkPermission("categories.delete"),
  deleteCategoryController,
);

export default router;
