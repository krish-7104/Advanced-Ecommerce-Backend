import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { limitToAdmin } from "../../../middlewares/limit-to-admin.middleware.js";
import { getAllUsersController } from "./user.controller.js";

const router = express.Router();

router.get("/", authMiddleware, limitToAdmin, getAllUsersController);

export default router;

