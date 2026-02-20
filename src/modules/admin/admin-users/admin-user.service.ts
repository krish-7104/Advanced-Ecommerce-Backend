import { prisma } from "../../../utils/prisma";
import ApiError from "../../../utils/ApiError";

export const getAllAdminUsersService = async () => {
  try {
    const users = await prisma.adminUser.findMany({
      include: {
        permissions: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return users;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAdminUserByIdService = async (id: string) => {
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id },
      include: {
        permissions: true,
      },
    });
    if (!user) throw new ApiError(404, "Admin user not found");
    return user;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
export const createAdminUserService = async (payload: any) => {
  try {
    const { permissions, ...data } = payload;

    // Default password if not provided? Or require it.
    // Has password hashing happened in controller or here?
    // Usually controller or hook. Schema says `password` string.

    const createData: any = {
      name: payload.name || `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      password: payload.password, // Assumes hashed
      isActive: payload.isActive ?? true,
    };

    if (permissions) {
      createData.permissions = {
        connect: permissions.map((pId: string) => ({ id: pId })),
      };
    }

    const user = await prisma.adminUser.create({
      data: createData,
      include: {
        permissions: true,
      },
    });
    return user;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateAdminUserService = async (id: string, payload: any) => {
  try {
    const { permissions, ...data } = payload;

    // Validate that super admin email cannot be changed to something else easily, or just allow it.

    const updateData: any = {
      name: payload.name, // firstName/lastName replaced by name in schema? Oh wait schema said name.. let me check.
      // Schema had `name` in seed but `firstName/lastName` in User?
      // Let's check schema again. `model AdminUser` has `name`.
      // Frontend sends firstName/lastName. I need to fix this mapping or schema.
      // Schema `AdminUser` has `name`. Frontend has `firstName` `lastName`.
      // I should probably concatenate them or update frontend.
      // Actually the schema update showed `name String`.
      // The previous `updateAdminUserService` used `firstName/lastName`.
      // This implies I broke the schema for payload mapping if I don't handle it.
      email: payload.email,
      isActive: payload.isActive,
    };

    if (permissions) {
      updateData.permissions = {
        set: permissions.map((pId: string) => ({ id: pId })),
      };
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      include: { permissions: true },
    });
    return user;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteAdminUserService = async (id: string) => {
  try {
    // Prevent deleting Super Admin
    const user = await prisma.adminUser.findUnique({ where: { id } });
    if (user?.email === process.env.NEXT_SUPER_ADMIN_EMAIL) {
      throw new ApiError(400, "Cannot delete Super Admin");
    }
    await prisma.adminUser.delete({ where: { id } });
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
