import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import ApiResponse from "./utils/ApiResponse.js";
import ApiError from "./utils/ApiError.js";
import cors from "cors";
import "dotenv/config";
import userAuthRoutes from "./modules/auth/auth.route.js";
import categoryRoutes from "./modules/catalog/category/category.route.js";
import productRoutes from "./modules/catalog/product/product.route.js";
import productVariantRoutes from "./modules/catalog/product-variant/product-variant.route.js";
import adminAuthRoutes from "./modules/admin/auth/admin-auth.route.js";
import roleRoutes from "./modules/admin/roles/role.route.js";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  })
);

// User Authentication
app.use("/api/v1/users/auth", userAuthRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/product/variants", productVariantRoutes);

// Admin
app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin/roles", roleRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res
      .status(err.statusCode)
      .json(new ApiResponse(err.statusCode, err.errors, err.message));
    return;
  }
  res
    .status(500)
    .json(new ApiResponse(500, [], err.message || "Internal Server Error"));
});

export default app;
