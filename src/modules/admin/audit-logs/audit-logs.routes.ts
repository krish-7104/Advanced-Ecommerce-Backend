import express from "express";
import { getAuditLogsController } from "./audit-logs.controller";
import { adminAuthMiddleware } from "../../../middlewares/admin-auth.middleware";

const router = express.Router();

router.get("/", adminAuthMiddleware, getAuditLogsController);

export default router;
