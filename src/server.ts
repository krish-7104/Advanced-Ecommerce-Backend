import http from "http";
import app from "./app.js";
import { config } from "dotenv";
config();

const PORT = Number(process.env.PORT) || 4000;

// create HTTP server
const server = http.createServer(app);

// start listening
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
