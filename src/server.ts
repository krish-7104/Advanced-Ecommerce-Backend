import http from "http";
import app from "./app.js";
import { config } from "dotenv";
import { initSocket } from "./utils/socket.js";
import { client } from "./utils/metrics.js";
import { createLogger, transports, format } from "winston";
config();

const SERVICE_NAME = process.env.SERVICE_NAME || "ecommercely-backend";
const ENV = process.env.NODE_ENV || "development";

export const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: { service: SERVICE_NAME, environment: ENV },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`,
        ),
      ),
    }),
  ],
});

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer(app);

app.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
});

// initialize socket
initSocket(server);

// start listening
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
