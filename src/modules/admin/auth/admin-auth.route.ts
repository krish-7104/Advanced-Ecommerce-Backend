import express from "express";
import {
  registerAdminController,
  loginAdminController,
  logoutAdminController,
  aboutAdminController,
  refreshAdminTokenController,
} from "./admin-auth.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";

const router = express.Router();

router.post("/register", authMiddleware, limitToAdmin, registerAdminController);
router.post("/login", loginAdminController);
router.get("/about/me", authMiddleware, limitToAdmin, aboutAdminController);
router.get("/refresh", refreshAdminTokenController);
router.post("/logout", authMiddleware, limitToAdmin, logoutAdminController);

export default router;
