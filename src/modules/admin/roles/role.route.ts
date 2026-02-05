import express from "express";
import {
  createRoleController,
  getAllRolesController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
} from "./role.controller.js";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";

const router = express.Router();

router.use(adminAuthMiddleware);

router.post("/", createRoleController);
router.get("/", getAllRolesController);
router.get("/:roleId", getRoleByIdController);
router.patch("/:roleId", updateRoleController);
router.delete("/:roleId", deleteRoleController);

export default router;
