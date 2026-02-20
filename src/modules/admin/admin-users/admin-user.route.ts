import { Router } from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware";
import { checkPermission } from "../../../middlewares/rbac.middleware";
import {
  getAllAdminUsersController,
  getAdminUserByIdController,
  createAdminUserController,
  updateAdminUserController,
  deleteAdminUserController,
} from "./admin-user.controller";

const router = Router();

router.use(adminAuthMiddleware);

router.get("/", checkPermission("admins:view"), getAllAdminUsersController);

router.post("/", checkPermission("admins:create"), createAdminUserController);

router.get("/:id", checkPermission("admins:view"), getAdminUserByIdController);

router.patch("/:id", checkPermission("admins:edit"), updateAdminUserController);

router.delete(
  "/:id",
  checkPermission("admins:delete"),
  deleteAdminUserController,
);

export default router;
