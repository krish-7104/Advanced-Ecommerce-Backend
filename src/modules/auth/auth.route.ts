import express from "express";
import {
  aboutUserController,
  loginUserController,
  LogoutController,
  refreshTokenController,
  registerUserController,
  updateUserController,
} from "./auth.controller.js";
import { limitToAdmin } from "../../middlewares/limit-to-admin.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/refresh", refreshTokenController);

router.patch("/update/me", authMiddleware, updateUserController);
router.patch(
  "/update/:userId",
  authMiddleware,
  limitToAdmin,
  updateUserController
);

router.get("/about/me", authMiddleware, aboutUserController);
router.get("/about/:userId", authMiddleware, limitToAdmin, aboutUserController);

router.post("/forget-password", () => {});
router.post("/update-password", () => {});

router.post("/logout", authMiddleware, LogoutController);

export default router;
