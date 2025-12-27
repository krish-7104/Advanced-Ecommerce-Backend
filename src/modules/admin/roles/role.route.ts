import express from "express";
import {
  createRoleController,
  getAllRolesController,
  getRoleByIdController,
  updateRoleController,
  deleteRoleController,
} from "./role.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";

const router = express.Router();

router.use(authMiddleware, limitToAdmin);

router.post("/", createRoleController);
router.get("/", getAllRolesController);
router.get("/:roleId", getRoleByIdController);
router.patch("/:roleId", updateRoleController);
router.delete("/:roleId", deleteRoleController);

export default router;
