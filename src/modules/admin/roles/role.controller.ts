import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import ApiResponse from "../../../utils/ApiResponse";
import {
  createRoleService,
  getAllRolesService,
  getRoleByIdService,
  updateRoleService,
  deleteRoleService,
} from "./role.service";

export const createRoleController = async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Role name is required");
  }

  const role = await createRoleService(req.body);

  return res.send(new ApiResponse(201, role, "Role created successfully"));
};

export const getAllRolesController = async (_req: Request, res: Response) => {
  const roles = await getAllRolesService();

  return res.send(new ApiResponse(200, roles, "Roles fetched successfully"));
};

export const getRoleByIdController = async (req: Request, res: Response) => {
  const { roleId } = req.params;

  if (!roleId) {
    throw new ApiError(400, "Role ID is required");
  }

  const role = await getRoleByIdService(roleId);

  return res.send(new ApiResponse(200, role, "Role fetched successfully"));
};

export const updateRoleController = async (req: Request, res: Response) => {
  const { roleId } = req.params;

  if (!roleId) {
    throw new ApiError(400, "Role ID is required");
  }

  const role = await updateRoleService(roleId, req.body);

  return res.send(new ApiResponse(200, role, "Role updated successfully"));
};

export const deleteRoleController = async (req: Request, res: Response) => {
  const { roleId } = req.params;

  if (!roleId) {
    throw new ApiError(400, "Role ID is required");
  }

  const result = await deleteRoleService(roleId);

  return res.send(new ApiResponse(200, result, "Role deleted successfully"));
};
