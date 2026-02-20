import { Request, Response, NextFunction } from "express";
import {
  getAllAdminUsersService,
  getAdminUserByIdService,
  createAdminUserService,
  updateAdminUserService,
  deleteAdminUserService,
} from "./admin-user.service";

export const getAllAdminUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const users = await getAllAdminUsersService();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

export const getAdminUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await getAdminUserByIdService(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const createAdminUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await createAdminUserService(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await updateAdminUserService(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteAdminUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await deleteAdminUserService(req.params.id);
    res.status(200).json({ message: "Admin user deleted successfully" });
  } catch (error) {
    next(error);
  }
};
