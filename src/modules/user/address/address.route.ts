import express from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import {
  getAllAddressesController,
  createAddressController,
  updateAddressController,
  deleteAddressController,
} from "./address.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getAllAddressesController);
router.post("/", authMiddleware, createAddressController);
router.patch("/:id", authMiddleware, updateAddressController);
router.delete("/:id", authMiddleware, deleteAddressController);

export default router;
