import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

const isIISNode = !!process.env.IISNODE_VERSION;

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

// Routes
import scheduleRoutes from "./routes/schedule";
import standingsRoutes from "./routes/standings";
import playerRoutes from "./routes/players";
import teamRoutes from "./routes/teams";
import searchRoutes from "./routes/search";
import predictionsRoutes from "./routes/predictions";
import leagueRoutes from "./routes/league";

app.use("/api/v1", scheduleRoutes);
app.use("/api/v1", standingsRoutes);
app.use("/api/v1", playerRoutes);
app.use("/api/v1", teamRoutes);
app.use("/api/v1", searchRoutes);
app.use("/api/v1", predictionsRoutes);
app.use("/api/v1", leagueRoutes);

// WebSockets
let wss: WebSocketServer;

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

  app.on("upgrade", (req: any, socket: any, head: any) => {
    wss.handleUpgrade(req, socket, head, ws => {
      wss.emit("connection", ws, req);
    });
  });
}

// WebSocket routing
import {
  scoreboardWebSocketManager,
  playbyplayWebSocketManager
} from "./services/websocketManager";

wss.on("connection", (ws, req: any) => {
  const url = req.url;

  if (url === "/api/v1/ws") {
    scoreboardWebSocketManager.handleConnection(ws);
  } else if (url.startsWith("/api/v1/playbyplay/ws/")) {
    const gameId = url.split("/").pop();
    playbyplayWebSocketManager.handleConnection(ws, gameId);
  }
});

// Background tasks (only safe outside IISNode)
import { dataCache } from "./services/dataCache";
import { startCleanupTask, stopCleanupTask } from "./services/keyMoments";

if (!isIISNode) {
  dataCache.startPolling();
  startCleanupTask();
  scoreboardWebSocketManager.startBroadcasting();
  playbyplayWebSocketManager.startBroadcasting();
  scoreboardWebSocketManager.startCleanupTask();
  playbyplayWebSocketManager.startCleanupTask();
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await dataCache.stopPolling();
  await stopCleanupTask();
  await scoreboardWebSocketManager.stopCleanupTask();
  await playbyplayWebSocketManager.stopCleanupTask();
  process.exit(0);
});

process.on("SIGINT", async () => {
  process.exit(0);
});

// Export app for IISNode
export default app;