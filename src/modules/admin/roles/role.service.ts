import { prisma } from "../../../utils/prisma";
import ApiError from "../../../utils/ApiError";
import { CreateRolePayload, UpdateRolePayload } from "./role.types";

export const createRoleService = async (payload: CreateRolePayload) => {
  try {
    const { name, description } = payload;

    if (!name || name.trim().length === 0) {
      throw new ApiError(400, "Role name is required");
    }

    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      throw new ApiError(409, "Role already exists");
    }

    const role = await prisma.role.create({
      data: { name, description },
    });

    return role;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllRolesService = async () => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            admins: true,
            permissions: true,
          },
        },
      },
    });

    return roles;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getRoleByIdService = async (roleId: string) => {
  try {
    if (!roleId) {
      throw new ApiError(400, "Role ID is required");
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            admins: true,
          },
        },
      },
    });

    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    return role;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateRoleService = async (
  roleId: string,
  payload: UpdateRolePayload
) => {
  try {
    if (!roleId) {
      throw new ApiError(400, "Role ID is required");
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      throw new ApiError(404, "Role not found");
    }

    if (payload.name) {
      const duplicateRole = await prisma.role.findFirst({
        where: {
          name: payload.name,
          id: { not: roleId },
        },
      });

      if (duplicateRole) {
        throw new ApiError(409, "Role with this name already exists");
      }
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(payload.name && { name: payload.name }),
        ...(payload.description !== undefined && {
          description: payload.description,
        }),
      },
    });

    return role;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteRoleService = async (roleId: string) => {
  try {
    if (!roleId) {
      throw new ApiError(400, "Role ID is required");
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { admins: true },
        },
      },
    });

    if (!existingRole) {
      throw new ApiError(404, "Role not found");
    }

    if (existingRole._count.admins > 0) {
      throw new ApiError(
        400,
        "Cannot delete role with assigned admins. Please reassign admins first."
      );
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    await prisma.role.delete({
      where: { id: roleId },
    });

    return { message: "Role deleted successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
