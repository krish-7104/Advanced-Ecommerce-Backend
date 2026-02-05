import express from "express";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware.js";
import { getAllAddressesController } from "./address.controller.js";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAllAddressesController);

export default router;

