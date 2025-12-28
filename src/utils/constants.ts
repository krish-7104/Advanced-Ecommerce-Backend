export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export const JWT_ACCESS_TOKEN_TTL = `${ACCESS_TOKEN_EXPIRY_MINUTES}m`; //15min
export const JWT_REFRESH_TOKEN_TTL = `${REFRESH_TOKEN_EXPIRY_DAYS}d`; //1d

export const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_MINUTES * 60 * 1000;

export const REFRESH_TOKEN_EXPIRY_MS =
  REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export const COOKIE_NAMES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
} as const;

export const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: ACCESS_TOKEN_EXPIRY_MS,
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: REFRESH_TOKEN_EXPIRY_MS,
};
