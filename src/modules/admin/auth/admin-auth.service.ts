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
    const { email, password, name } = payload;

    if (!email || !email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    if (!password || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    if (!name?.trim()) {
      throw new ApiError(400, "Name is required");
    }

    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new ApiError(409, "Admin already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.adminUser.create({
      data: {
        email,
        password: passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: {
          select: {
            permissions: true,
          },
        },
      },
    });

    const accessToken = jwt.sign(
      { userId: admin.id, type: "ADMIN" },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL },
    );

    // Generates a refresh token hash it and store it in db
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
    });

    if (!admin || !admin.password) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (!admin.isActive) {
      throw new ApiError(403, "Admin account is deactivated");
    }

    // validates the passwotd
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // create access token jwt
    const accessToken = jwt.sign(
      { userId: admin.id, type: "ADMIN" },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL },
    );

    // Generate refresh token hash it and store it in db
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

    // From frontend we get plain text but in db it is stored in hashed format so. we hash it and then check in db
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const token = await prisma.adminUserToken.findUnique({
      where: { tokenHash },
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

    // From frontend we get plain text but in db it is stored in hashed format so. we hash it and then check in db
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await prisma.adminUserToken.findUnique({
      where: { tokenHash },
    });

    // if we dont get stored token or the token is revoked the logout all sessions
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
      { userId: storedToken.userId, type: "ADMIN" },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: JWT_ACCESS_TOKEN_TTL },
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
