import { prisma } from "../../../utils/prisma";
import ApiError from "../../../utils/ApiError";
import bcrypt from "bcrypt";
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
    let passwordHash = "";
    if (payload.password) {
      passwordHash = await bcrypt.hash(payload.password, 10);
    }

    const createData: any = {
      name: payload.name || `${payload.firstName} ${payload.lastName}`,
      email: payload.email,
      password: passwordHash,
      isActive: payload.isActive ?? true,
    };

    if (payload.permissions) {
      createData.permissions = {
        connect: payload.permissions.map((pId: string) => ({ id: pId })),
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
    const updateData: any = {
      name: payload.name,
      email: payload.email,
      isActive: payload.isActive,
    };

    if (payload.password) {
      updateData.password = await bcrypt.hash(payload.password, 10);
    }

    if (payload.permissions) {
      updateData.permissions = {
        set: payload.permissions.map((pId: string) => ({ id: pId })),
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
