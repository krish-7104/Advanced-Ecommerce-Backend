import { Request, Response } from "express";
import { getAuditLogService } from "./audit-logs.service";
import ApiResponse from "../../../utils/ApiResponse";

export const getAuditLogsController = async (req: Request, res: Response) => {
  const audiLogs = await getAuditLogService();
  res.send(new ApiResponse(200, audiLogs, "Audit logs get successfully!"));
};
