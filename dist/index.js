"use strict";

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { WebSocketServer } = require("ws");

// Detect IISNode
const isIISNode = !!process.env.IISNODE_VERSION;

// Load env
dotenv.config({ path: path.join(process.cwd(), ".env") });

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "NBA Live API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    iisnode: isIISNode
  });
});

// API routes
app.use("/api/v1", require("./routes/schedule"));
app.use("/api/v1", require("./routes/standings"));
app.use("/api/v1", require("./routes/players"));
app.use("/api/v1", require("./routes/teams"));
app.use("/api/v1", require("./routes/search"));
app.use("/api/v1", require("./routes/predictions"));
app.use("/api/v1", require("./routes/league"));

// WebSockets
let wss;

if (!isIISNode) {
  // Local development
  const server = http.createServer(app);
  wss = new WebSocketServer({ server });

  server.listen(process.env.PORT || 8000, () => {
    console.log("Local server running");
  });
} else {
  // IISNode mode
  wss = new WebSocketServer({ noServer: true });

  app.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit("connection", ws, req);
    });
  });
}

// WebSocket routing
wss.on("connection", (ws, req) => {
  const url = req.url;

  if (url === "/api/v1/ws") {
    require("./services/websocketManager").scoreboardWebSocketManager.handleConnection(ws);
  } else if (url.startsWith("/api/v1/playbyplay/ws/")) {
    const gameId = url.split("/").pop();
    require("./services/websocketManager").playbyplayWebSocketManager.handleConnection(ws, gameId);
  }
});

// Export app for IISNode
module.exports = app;