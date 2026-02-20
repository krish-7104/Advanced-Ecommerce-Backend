import { prisma } from "../../../utils/prisma";
import ApiError from "../../../utils/ApiError";
import { PERMISSIONS_CONFIG } from "../../../constants/permissions";

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

/**
 * Returns the static permissions config JSON grouped by section/resource.
 * No database call needed – this is the source of truth for the permission list.
 * Used by the frontend to render the grouped permission picker UI.
 */
export const getPermissionsConfigService = () => {
  return PERMISSIONS_CONFIG;
};
