import express from "express";
import {
  registerAdminController,
  loginAdminController,
  logoutAdminController,
  aboutAdminController,
  refreshAdminTokenController,
} from "./admin-auth.controller.js";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";

const router = express.Router();

router.post("/register", adminAuthMiddleware, registerAdminController);
router.post("/login", loginAdminController);
router.get("/about/me", adminAuthMiddleware, aboutAdminController);
router.get("/refresh", refreshAdminTokenController);
router.post("/logout", adminAuthMiddleware, logoutAdminController);

export default router;
