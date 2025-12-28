import { createHash } from "node:crypto";
import { randomBytes } from "node:crypto";

export const toBool = (value?: boolean | string): boolean =>
  value === true || value === "true";

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString("hex");
};
