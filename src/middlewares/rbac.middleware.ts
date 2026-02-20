import { Response, NextFunction, Request } from "express";
import ApiError from "../utils/ApiError";
import { prisma } from "../utils/prisma";

export const checkPermission = (permissionCode: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return next(new ApiError(401, "Unauthorized"));
      }

      const admin = await prisma.adminUser.findUnique({
        where: { id: userId },
        include: {
          permissions: true,
        },
      });

      if (!admin) {
        return next(new ApiError(401, "Admin not found"));
      }

      if (!admin.isActive) {
        return next(new ApiError(403, "Admin account is deactivated"));
      }

      // 1. Check if Super Admin (ENV)
      if (
        process.env.NEXT_SUPER_ADMIN_EMAIL &&
        admin.email === process.env.NEXT_SUPER_ADMIN_EMAIL
      ) {
        return next();
      }

      // 2. Check specific permission
      const hasPermission = admin.permissions.some(
        (p) => p.code === permissionCode,
      );

      if (!hasPermission) {
        return next(
          new ApiError(
            403,
            "You do not have permission to perform this action",
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
