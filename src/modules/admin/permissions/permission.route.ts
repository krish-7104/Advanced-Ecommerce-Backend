import { Router } from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware";
import { getAllPermissionsController } from "./permission.controller";
import { checkPermission } from "../../../middlewares/rbac.middleware";

const router = Router();

// Retrieve all permissions (Requires ADMIN_MANAGEMENT or relevant permission)
// Typically, anyone who can manage roles should be able to see permissions.
router.get(
  "/",
  adminAuthMiddleware,
  checkPermission("ADMIN_MANAGEMENT"),
  getAllPermissionsController,
);

export default router;
