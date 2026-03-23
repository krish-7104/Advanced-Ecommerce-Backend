import { AuditAction } from "../../generated/prisma/enums";
import { prisma } from "../utils/prisma";

export const addToAuditLog = async (
  action: AuditAction,
  beforeData: any,
  afterData: any,
  adminId: string,
  entityId: string,
  entity: string,
) => {
  try {
    await prisma.adminAuditLog.create({
      data: {
        beforeData,
        afterData,
        adminId,
        entityId,
        entity,
        action,
      },
    });
  } catch (error) {
    console.log(error);
  }
};
