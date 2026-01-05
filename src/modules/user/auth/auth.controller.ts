import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  registerUserService,
  loginUserService,
  refreshTokenService,
  updateUserService,
  aboutUserService,
  logoutUserService,
} from "./auth.service";
import ApiResponse from "../../../utils/ApiResponse";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../../../utils/constants";

export const registerUserController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { user, accessToken, refreshToken } = await registerUserService(
    req.body
  );

  res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(201, user, "Registered Successfully"));
};

export const loginUserController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { user, accessToken, refreshToken } = await loginUserService(req.body);

  res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(200, user, "Logged In Successfully"));
};

export const refreshTokenController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  const { accessToken, refreshToken: newRefreshToken } =
    await refreshTokenService(refreshToken);

  res.cookie("access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("refresh_token", newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(200, [], "Session refreshed"));
};

export const updateUserController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const user = await updateUserService(req.body, userId);

  return res.send(new ApiResponse(200, user, "User details updated"));
};

export const aboutUserController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const queryParams = req.query;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const user = await aboutUserService(userId, queryParams);

  return res.send(new ApiResponse(200, user, "User details get successfully"));
};

export const logoutUserController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token;

  await logoutUserService(refreshToken);

  res.clearCookie("access_token", ACCESS_COOKIE_OPTIONS);
  res.clearCookie("refresh_token", REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(200, [], "Logged out successfully"));
};
