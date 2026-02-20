import { prisma } from "../../../utils/prisma";
import ApiError from "../../../utils/ApiError";

export const getAllPermissionsService = async () => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { code: "asc" },
    });
    return permissions;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
