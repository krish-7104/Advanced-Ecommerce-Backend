import { Request, Response } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import { getAllAddressesService } from "./address.service";
import { GetAllAddressesQueryParams } from "./address.types";

export const getAllAddressesController = async (
  req: Request,
  res: Response
) => {
  const queryParams = req.query as GetAllAddressesQueryParams;
  const result = await getAllAddressesService(queryParams);
  res.send(
    new ApiResponse(
      200,
      result.data,
      "Addresses retrieved successfully",
      result.pagination
    )
  );
};

