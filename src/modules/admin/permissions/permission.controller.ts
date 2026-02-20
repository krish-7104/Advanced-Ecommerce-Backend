import { Request, Response, NextFunction } from "express";
import { getAllPermissionsService } from "./permission.service";

export const getAllPermissionsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const permissions = await getAllPermissionsService();
    res.status(200).json(permissions);
  } catch (error) {
    next(error);
  }
};
