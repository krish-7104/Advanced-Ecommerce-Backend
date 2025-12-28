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
import {
  generateRefreshToken,
  hashToken,
} from "../../../utils/common-functions";

export const registerAdminService = async (payload: RegisterAdminPayload) => {
  try {
    const { email, password, name, roleId } = payload;

    if (!email || !email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    if (!password || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    if (!name?.trim()) {
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

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ApiError(404, "Role not found");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: passwordHash,
        name,
        roleId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
      },
    });

    const accessToken = jwt.sign(
      { userId: admin.id, type: "ADMIN" },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL }
    );

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.adminUserToken.create({
      data: {
        userId: admin.id,
        tokenHash: refreshTokenHash,
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
      throw new ApiError(401, "Invalid credentials");
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

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.adminUserToken.create({
      data: {
        userId: admin.id,
        tokenHash: refreshTokenHash,
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
      where: { tokenHash: refreshToken },
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

export const aboutAdminService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const user = await prisma.adminUser.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
      include: {
        role: true,
      },
    });

    return user;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const refreshAdminTokenService = async (refreshToken: string) => {
  try {
    if (!refreshToken) {
      throw new ApiError(401, "Missing refresh token");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await prisma.adminUserToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revoked) {
      if (storedToken?.userId) {
        // revoke all sessions for safety
        await prisma.adminUserToken.updateMany({
          where: { userId: storedToken.userId },
          data: { revoked: true },
        });
      }

      throw new ApiError(401, "Invalid refresh token");
    }

    // Expired
    if (storedToken.expiresAt < new Date()) {
      console.log("EXPRIRED");
      throw new ApiError(401, "Refresh token expired");
    }

    // Rotate: revoke old token
    await prisma.adminUserToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new refresh token
    const newRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    await prisma.adminUserToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    // New access token
    const newAccessToken = jwt.sign(
      { userId: storedToken.userId },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL }
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    console.log({ error });
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
