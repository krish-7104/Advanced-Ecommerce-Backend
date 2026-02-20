import { Router } from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware";
import {
  getAllPermissionsController,
  getPermissionsConfigController,
} from "./permission.controller";
import { checkPermission } from "../../../middlewares/rbac.middleware";

const router = Router();

// All permission routes require admin auth
router.use(adminAuthMiddleware);

/**
 * GET /permissions/config
 * Returns the static permissions config grouped by section/resource.
 * Any authenticated admin can access this — it's just a display list.
 */
router.get("/config", getPermissionsConfigController);

/**
 * GET /permissions
 * Returns all Permission rows from the DB (with id, code, resource, action).
 * Used by the admin form to map selected IDs when creating/updating admins.
 */
router.get("/", checkPermission("admins.view"), getAllPermissionsController);

export default router;
