import express from "express";
import {
  getAllStatesController,
  getCitiesByStateController,
  getAllStatesCitiesController,
} from "./states-cities.controller.js";

const router = express.Router();

router.get("/", getAllStatesController);
router.get("/all", getAllStatesCitiesController);
router.get("/:stateName/cities", getCitiesByStateController);

export default router;

