import { Request, Response } from "express";
import ApiError from "../../../utils/ApiError";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getAllAddressesService,
  createAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
} from "./address.service";

export const getAllAddressesController = async (
  req: Request,
  res: Response
) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const addresses = await getAllAddressesService(userId);

  return res.send(
    new ApiResponse(200, addresses, "Addresses retrieved successfully")
  );
};

export const createAddressController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  const address = await createAddressService(req.body, userId);

  return res.send(
    new ApiResponse(201, address, "Address created successfully")
  );
};

export const updateAddressController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const addressId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!addressId) {
    throw new ApiError(400, "Address ID is required");
  }

  const address = await updateAddressService(addressId, req.body, userId);

  return res.send(
    new ApiResponse(200, address, "Address updated successfully")
  );
};

export const deleteAddressController = async (req: Request, res: Response) => {
  const userId = req?.user?.userId;
  const addressId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!addressId) {
    throw new ApiError(400, "Address ID is required");
  }

  await deleteAddressService(addressId, userId);

  return res.send(new ApiResponse(200, [], "Address deleted successfully"));
};

export const setDefaultAddressController = async (
  req: Request,
  res: Response
) => {
  const userId = req?.user?.userId;
  const addressId = req.params.id;

  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }

  if (!addressId) {
    throw new ApiError(400, "Address ID is required");
  }

  const address = await setDefaultAddressService(addressId, userId);

  return res.send(
    new ApiResponse(200, address, "Default address updated successfully")
  );
};
