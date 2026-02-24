import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";
import { checkPermission } from "../../../middlewares/rbac.middleware";
import { getAllAddressesController } from "./address.controller.js";

const router = express.Router();

router.get(
  "/",
  adminAuthMiddleware,
  checkPermission("users.view"),
  getAllAddressesController,
);

export default router;

