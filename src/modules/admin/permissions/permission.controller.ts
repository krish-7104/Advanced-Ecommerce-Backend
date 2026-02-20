import { Request, Response, NextFunction } from "express";
import {
  getAllPermissionsService,
  getPermissionsConfigService,
} from "./permission.service";

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

/**
 * Returns the static permissions config (grouped by section/resource).
 * Used by the frontend to render the permission picker UI when creating/editing admins.
 */
export const getPermissionsConfigController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const config = getPermissionsConfigService();
    res.status(200).json(config);
  } catch (error) {
    next(error);
  }
};
