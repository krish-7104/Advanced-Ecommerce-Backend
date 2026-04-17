import { Redis } from "ioredis";
import { redisCacheHitsTotal, redisCacheMissesTotal } from "./metrics.js";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

export const DEFAULT_CACHE_TTL = 3600;

export const getCacheKey = (...parts: string[]): string => {
  return parts.join(":");
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(key);
    const keyPrefix = key.split(":")[0] ?? key;
    if (data) {
      console.log(`[Redis] Cache HIT for key: ${key}`);
      redisCacheHitsTotal.inc({ key_prefix: keyPrefix });
      return JSON.parse(data);
    }
    console.log(`[Redis] Cache MISS for key: ${key}`);
    redisCacheMissesTotal.inc({ key_prefix: keyPrefix });
    return null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: any,
  ttl: number = DEFAULT_CACHE_TTL,
): Promise<void> => {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error("Redis set error:", error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Redis delete error:", error);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error("Redis delete pattern error:", error);
  }
};

export const invalidateCache = async (...patterns: string[]): Promise<void> => {
  try {
    for (const pattern of patterns) {
      await deleteCachePattern(pattern);
    }
  } catch (error) {
    console.error("Redis invalidate error:", error);
  }
};

export default redis;
