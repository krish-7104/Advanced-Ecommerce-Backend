import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import ApiResponse from "./utils/ApiResponse.js";
import ApiError from "./utils/ApiError.js";
import cors from "cors";
import "dotenv/config";
import path from "path";

// Routes - User
import userAuthRoutes from "./modules/user/auth/auth.route.js";
import userCategoryRoutes from "./modules/user/catalog/category/category.route.js";
import userProductRoutes from "./modules/user/catalog/product/product.route.js";
import userAddressRoutes from "./modules/user/address/address.route.js";
import userCartRoutes from "./modules/user/cart/cart.route.js";
import userWishlistRoutes from "./modules/user/cart/wishlist.route.js";
import userOrderRoutes from "./modules/user/order/order.route.js";
import userPaymentRoutes from "./modules/user/payment/payment.route.js";

// Routes - Admin
import categoryRoutes from "./modules/admin/catalog/category/category.route.js";
import productRoutes from "./modules/admin/catalog/product/product.route.js";
import productVariantRoutes from "./modules/admin/catalog/product-variant/product-variant.route.js";
import adminAuthRoutes from "./modules/admin/auth/admin-auth.route.js";
import systemAdminRoutes from "./modules/admin/admin-users/admin-user.route.js";
import adminUserRoutes from "./modules/admin/users/user.route.js";
import adminAddressRoutes from "./modules/admin/addresses/address.route.js";
import adminOrderRoutes from "./modules/admin/order/order.route.js";
import permissionRoutes from "./modules/admin/permissions/permission.route.js";
import adminDashboardRoutes from "./modules/admin/dashboard/dashboard.routes.js";

// Routes - Reference
import statesCitiesRoutes from "./modules/reference/states-cities/states-cities.route.js";

import { stripePaymentWebhookController } from "./modules/user/payment/payment.controller.js";
import Stripe from "stripe";

const app = express();

// Webhook route needs raw body for Stripe signature verification
// Register it before express.json() middleware
app.post(
  "/api/v1/users/payment/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripePaymentWebhookController,
);

app.use(express.json());
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
    );
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/media", express.static(path.join(process.cwd(), "media")));

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
    credentials: true,
  }),
);

// Reference Data
app.use("/api/v1/states", statesCitiesRoutes);

// User Authentication
app.use("/api/v1/users/auth", userAuthRoutes);
app.use("/api/v1/users/category", userCategoryRoutes);
app.use("/api/v1/users/product", userProductRoutes);
app.use("/api/v1/users/address", userAddressRoutes);
app.use("/api/v1/users/cart", userCartRoutes);
app.use("/api/v1/users/wishlist", userWishlistRoutes);
app.use("/api/v1/users/order", userOrderRoutes);
app.use("/api/v1/users/payment", userPaymentRoutes);

// Admin
app.use("/api/v1/admin/category", categoryRoutes);
app.use("/api/v1/admin/product", productRoutes);
app.use("/api/v1/admin/product/variants", productVariantRoutes);

app.use("/api/v1/admin/auth", adminAuthRoutes);
app.use("/api/v1/admin/admins", systemAdminRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/addresses", adminAddressRoutes);
app.use("/api/v1/admin/order", adminOrderRoutes);
app.use("/api/v1/admin/permissions", permissionRoutes);
app.use("/api/v1/admin/dashboard", adminDashboardRoutes);

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
