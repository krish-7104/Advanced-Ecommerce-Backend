import { Request, Response } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import { getAllUsersService } from "./user.service";
import { GetAllUsersQueryParams } from "./user.types";

export const getAllUsersController = async (req: Request, res: Response) => {
  const queryParams = req.query as GetAllUsersQueryParams;
  const result = await getAllUsersService(queryParams);
  res.send(
    new ApiResponse(
      200,
      result.data,
      "Users retrieved successfully",
      result.pagination
    )
  );
};

