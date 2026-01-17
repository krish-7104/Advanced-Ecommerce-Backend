import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  AboutUserQueryParams,
  ForgotPasswordPayload,
  LoginUserPayload,
  RegisterUserPayload,
  UpdatePasswordPayload,
  UserUpdatePayload,
  VerifyEmailPayload,
} from "./auth.types";

import "dotenv/config";
import ApiError from "../../../utils/ApiError";
import { prisma } from "../../../utils/prisma";
import {
  JWT_ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_EXPIRY_MS,
} from "../../../utils/constants";
import {
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
} from "../../../utils/email.service";
import { CartItemStatus } from "../../../../generated/prisma/enums";

export const registerUserService = async (payload: RegisterUserPayload) => {
  try {
    const { email, password, firstName, lastName } = payload;

    if (!email || !email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    if (!password || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashPassword, firstName, lastName },
      omit: { password: true, createdAt: true, updatedAt: true },
    });

    // Access token
    const accessToken = jwt.sign(
      { userId: user.id, type: "USER" },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: JWT_ACCESS_TOKEN_TTL,
      }
    );

    // Generates a refresh token hash it and store it in db
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await prisma.userToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const loginUserService = async (payload: LoginUserPayload) => {
  try {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new ApiError(404, "User don't exist");
    }

    // validates the passwotd
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // create access token jwt
    const accessToken = jwt.sign(
      { userId: user.id, type: "USER" },
      process.env.JWT_SECRET_KEY!,
      {
        expiresIn: JWT_ACCESS_TOKEN_TTL,
      }
    );

    // Generate refresh token hash it and store it in db
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await prisma.userToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updateUserService = async (
  payload: UserUpdatePayload,
  userId: string
) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const USER_UPDATE_FIELDS = [
      "firstName",
      "lastName",
      "phoneNumber",
      "email",
      "emailVerified",
      "emailVerifiedAt",
    ] as const;

    const updatedPayload: Partial<
      Record<(typeof USER_UPDATE_FIELDS)[number], unknown>
    > = {};

    for (const key of USER_UPDATE_FIELDS) {
      if (
        payload[key] !== undefined &&
        payload[key] !== null &&
        typeof payload[key] === "string" &&
        payload[key].length > 0
      ) {
        updatedPayload[key] = payload[key];
      }
    }

    if (Object.keys(updatedPayload).length === 0) {
      throw new ApiError(400, "No valid fields to update");
    }

    return prisma.user.update({
      where: { id: userId },
      data: updatedPayload as any,
      omit: {
        password: false,
      },
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const aboutUserService = async (
  userId: string,
  queryParams: AboutUserQueryParams
) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
      include: {
        addresses: queryParams.address === "true" ? true : false,
        cartItems: queryParams.cart === "true" ? true : false,
        orders: queryParams.order === "true" ? true : false,
        _count: {
          select: {
            addresses: true,
            cartItems: {
              where: {
                status: CartItemStatus.ACTIVE,
              },
            },
            orders: true,
          },
        },
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

export const logoutUserService = async (refreshToken: string) => {
  try {
    if (!refreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }

    // From frontend we get plain text but in db it is stored in hashed format so. we hash it and then check in db
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const token = await prisma.userToken.findUnique({
      where: { tokenHash },
    });

    if (token) {
      await prisma.userToken.delete({
        where: { id: token.id },
      });
    }

    return { message: "Logged out successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    if (!refreshToken) {
      throw new ApiError(401, "Missing refresh token");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const storedToken = await prisma.userToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revoked) {
      if (storedToken?.userId) {
        // revoke all sessions for safety
        await prisma.userToken.updateMany({
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
    await prisma.userToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new refresh token
    const newRefreshToken = crypto.randomBytes(64).toString("hex");
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    await prisma.userToken.create({
      data: {
        userId: storedToken.userId,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    // New access token
    const newAccessToken = jwt.sign(
      { userId: storedToken.userId, type: "USER" },
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
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const forgotPasswordService = async (payload: ForgotPasswordPayload) => {
  try {
    const { email } = payload;

    if (!email || !email.includes("@")) {
      throw new ApiError(400, "Invalid email address");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return {
        message: "If the email exists, a password reset link has been sent",
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.userToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(user.email, resetToken);

    return {
      message: "If the email exists, a password reset link has been sent",
    };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const updatePasswordService = async (payload: UpdatePasswordPayload) => {
  try {
    const { token, newPassword } = payload;

    if (!token) {
      throw new ApiError(400, "Reset token is required");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const storedToken = await prisma.userToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    if (storedToken.revoked) {
      throw new ApiError(400, "Reset token has already been used");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new ApiError(400, "Reset token has expired");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: storedToken.userId },
        data: { password: hashedPassword },
      });

      await tx.userToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      await tx.userToken.updateMany({
        where: {
          userId: storedToken.userId,
          revoked: false,
        },
        data: { revoked: true },
      });
    });

    return { message: "Password updated successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const sendEmailVerificationService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.emailVerified) {
      throw new ApiError(400, "Email is already verified");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.userToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await sendEmailVerificationEmail(user.email, verificationToken);

    return { message: "Verification email sent successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const verifyEmailService = async (payload: VerifyEmailPayload) => {
  try {
    const { token } = payload;

    if (!token) {
      throw new ApiError(400, "Verification token is required");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const storedToken = await prisma.userToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new ApiError(400, "Invalid or expired verification token");
    }

    if (storedToken.revoked) {
      throw new ApiError(400, "Verification token has already been used");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new ApiError(400, "Verification token has expired");
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: storedToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.userToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });
    });

    return { message: "Email verified successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const getAllSessionsService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const sessions = await prisma.userToken.findMany({
      where: {
        userId,
        revoked: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: session.expiresAt > new Date(),
    }));
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const logoutSessionService = async (
  sessionId: string,
  userId: string
) => {
  try {
    if (!sessionId) {
      throw new ApiError(400, "Session ID is required");
    }

    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    const session = await prisma.userToken.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new ApiError(404, "Session not found");
    }

    if (session.userId !== userId) {
      throw new ApiError(
        403,
        "You don't have permission to logout this session"
      );
    }

    await prisma.userToken.update({
      where: { id: sessionId },
      data: { revoked: true },
    });

    return { message: "Session logged out successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};

export const deleteAccountService = async (userId: string) => {
  try {
    if (!userId) {
      throw new ApiError(400, "UserId is required");
    }

    await prisma.$transaction(async (tx) => {
      await tx.userToken.deleteMany({
        where: { userId },
      });

      await tx.address.deleteMany({
        where: { userId },
      });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { message: "Account deleted successfully" };
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, error?.message || "Something Went Wrong");
  }
};
