import express from "express";
import {
  aboutUserController,
  loginUserController,
  logoutUserController,
  refreshTokenController,
  registerUserController,
  updateUserController,
} from "./auth.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/refresh", refreshTokenController);
router.patch("/update/me", authMiddleware, updateUserController);
router.get("/about/me", authMiddleware, aboutUserController);
router.post("/forget-password", () => {});
router.post("/update-password", () => {});

router.post("/logout", authMiddleware, logoutUserController);

export default router;
