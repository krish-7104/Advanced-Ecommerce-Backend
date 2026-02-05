import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import {
  registerAdminService,
  loginAdminService,
  logoutAdminService,
  aboutAdminService,
  refreshAdminTokenService,
} from "./admin-auth.service";
import ApiResponse from "../../../utils/ApiResponse";
import {
  ACCESS_COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} from "../../../utils/constants";

export const registerAdminController = async (req: Request, res: Response) => {
  const { email, password, name, roleId } = req.body;

  if (!email || !password || !name || !roleId) {
    throw new ApiError(400, "Email, password, name, and roleId are required");
  }

  const { admin, accessToken, refreshToken } = await registerAdminService(
    req.body
  );

  res.cookie("admin_access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("admin_refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(201, admin, "Admin registered successfully"));
};

export const loginAdminController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { admin, accessToken, refreshToken } = await loginAdminService(
    req.body
  );

  res.cookie("admin_access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("admin_refresh_token", refreshToken, REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(200, admin, "Logged in successfully"));
};

export const logoutAdminController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.admin_refresh_token;

  await logoutAdminService(refreshToken);

  res.clearCookie("admin_access_token", ACCESS_COOKIE_OPTIONS);
  res.clearCookie("admin_refresh_token", REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(200, [], "Logged out successfully"));
};

export const aboutAdminController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const user = await aboutAdminService(userId);

  return res.send(new ApiResponse(200, user, "Admin details get successfull"));
};

export const refreshAdminTokenController = async (
  req: Request,
  res: Response
) => {
  const refreshToken = req.cookies?.admin_refresh_token;

  const { accessToken, refreshToken: newRefreshToken } =
    await refreshAdminTokenService(refreshToken);

  res.cookie("admin_access_token", accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie("admin_refresh_token", newRefreshToken, REFRESH_COOKIE_OPTIONS);

  return res.send(new ApiResponse(200, [], "Session refreshed"));
};
