import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../../utils/prisma";
import ApiError from "../../../utils/ApiError";
import { LoginAdminPayload, RegisterAdminPayload } from "./admin-auth.types";
import {
  JWT_ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_EXPIRY_MS,
} from "../../../utils/constants";
import "dotenv/config";

export const registerAdminService = async (payload: RegisterAdminPayload) => {
  try {
    const { email, password, name, roleId } = payload;

    if (!email || !email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    if (!password || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    if (!name || name.trim().length === 0) {
      throw new ApiError(400, "Name is required");
    }

    if (!roleId) {
      throw new ApiError(400, "Role ID is required");
    }

    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });
    if (existingAdmin) {
      throw new ApiError(409, "Admin already exists");
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.create({
      data: { email, password: hashPassword, name, roleId },
      omit: { password: true },
    });

    const accessToken = jwt.sign(
      { userId: admin.id, type: "ADMIN" },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await prisma.adminUserToken.create({
      data: {
        userId: admin.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      admin,
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const loginAdminService = async (payload: LoginAdminPayload) => {
  try {
    const { email, password } = payload;

    const admin = await prisma.adminUser.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!admin || !admin.password) {
      throw new ApiError(404, "Admin doesn't exist");
    }

    if (!admin.isActive) {
      throw new ApiError(403, "Admin account is deactivated");
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const accessToken = jwt.sign(
      { userId: admin.id, type: "ADMIN" },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await prisma.adminUserToken.create({
      data: {
        userId: admin.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const logoutAdminService = async (refreshToken: string) => {
  try {
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    const token = await prisma.adminUserToken.findUnique({
      where: { token: refreshToken },
    });

    if (token) {
      await prisma.adminUserToken.delete({
        where: { id: token.id },
      });
    }

    return { message: "Logged out successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
