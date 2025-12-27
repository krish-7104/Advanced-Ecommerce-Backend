import express from "express";
import {
  registerAdminController,
  loginAdminController,
  logoutAdminController,
} from "./admin-auth.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";

const router = express.Router();

router.post("/register", registerAdminController);
router.post("/login", loginAdminController);
router.post("/logout", authMiddleware, limitToAdmin, logoutAdminController);

export default router;
