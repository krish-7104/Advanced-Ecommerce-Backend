import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(new ApiError(401, "Unauthorized"));
  }

  if (!process.env.JWT_SECRET_KEY) {
    throw new ApiError(401, "JWT Secret not Configured");
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};
