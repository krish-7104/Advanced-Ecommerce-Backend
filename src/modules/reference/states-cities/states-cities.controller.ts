import { Request, Response } from "express";
import ApiResponse from "../../../utils/ApiResponse";
import {
  getAllStatesService,
  getCitiesByStateService,
  getAllStatesCitiesService,
} from "./states-cities.service";

export const getAllStatesController = async (
  _req: Request,
  res: Response
) => {
  const states = getAllStatesService();
  return res.send(
    new ApiResponse(200, states, "States retrieved successfully")
  );
};

export const getCitiesByStateController = async (
  req: Request,
  res: Response
) => {
  const stateName = req.params.stateName;

  if (!stateName) {
    return res
      .status(400)
      .send(new ApiResponse(400, [], "State name is required"));
  }

  const result = getCitiesByStateService(stateName);
  return res.send(
    new ApiResponse(200, result, "Cities retrieved successfully")
  );
};

export const getAllStatesCitiesController = async (
  _req: Request,
  res: Response
) => {
  const data = getAllStatesCitiesService();
  return res.send(
    new ApiResponse(200, data, "States and cities retrieved successfully")
  );
};

