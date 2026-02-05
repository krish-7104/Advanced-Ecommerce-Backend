import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";
import { getAllUsersController } from "./user.controller.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllUsersController);

export default router;

