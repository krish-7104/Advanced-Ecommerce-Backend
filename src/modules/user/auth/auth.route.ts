import express from "express";
import {
  aboutUserController,
  forgotPasswordController,
  loginUserController,
  logoutUserController,
  refreshTokenController,
  registerUserController,
  sendEmailVerificationController,
  updatePasswordController,
  updateUserController,
  verifyEmailController,
  getAllSessionsController,
  logoutSessionController,
  deleteAccountController,
} from "./auth.controller.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.get("/refresh", refreshTokenController);
router.patch("/update/me", authMiddleware, updateUserController);
router.get("/about/me", authMiddleware, aboutUserController);
router.post("/forgot-password", forgotPasswordController);
router.post("/update-password", updatePasswordController);
router.post(
  "/send-email-verification",
  authMiddleware,
  sendEmailVerificationController,
);
router.post("/verify-email", verifyEmailController);
router.post("/logout", authMiddleware, logoutUserController);
router.get("/sessions", authMiddleware, getAllSessionsController);
router.post("/sessions/:id/logout", authMiddleware, logoutSessionController);
router.delete("/account", authMiddleware, deleteAccountController);

export default router;
