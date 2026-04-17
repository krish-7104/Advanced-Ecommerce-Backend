import client from "prom-client";

client.collectDefaultMetrics({ register: client.register });

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const redisCacheHitsTotal = new client.Counter({
  name: "redis_cache_hits_total",
  help: "Total number of Redis cache hits",
  labelNames: ["key_prefix"],
});

export const redisCacheMissesTotal = new client.Counter({
  name: "redis_cache_misses_total",
  help: "Total number of Redis cache misses",
  labelNames: ["key_prefix"],
});

export const activeHttpConnections = new client.Gauge({
  name: "active_http_connections",
  help: "Number of active HTTP connections currently being processed",
});

export { client };
