// Token expiry configuration (in minutes/days)
export const ACCESS_TOKEN_EXPIRY_DAY = 1;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// JWT TTL strings (for jwt.sign)
export const JWT_ACCESS_TOKEN_TTL = `${ACCESS_TOKEN_EXPIRY_DAY}d`;
export const JWT_REFRESH_TOKEN_TTL = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;

// Token expiry in milliseconds (for cookies/DB)
export const ACCESS_TOKEN_EXPIRY_MS = ACCESS_TOKEN_EXPIRY_DAY * 60 * 1000;
export const REFRESH_TOKEN_EXPIRY_MS =
  REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

// Cookie names
export const COOKIE_NAMES = {
  USER_ACCESS_TOKEN: "access_token",
  USER_REFRESH_TOKEN: "refresh_token",
  access_token: "access_token",
  refresh_token: "refresh_token",
} as const;

// Cookie options
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
