import { Request, Response, NextFunction } from "express";
import ApiError from "../utils/ApiError";

export const limitToAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (req.user.type !== "ADMIN") {
    return next(new ApiError(403, "Forbidden: Admin access only"));
  }

  return next();
};
