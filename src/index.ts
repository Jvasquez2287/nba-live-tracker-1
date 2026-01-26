import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { scoreboardWebSocketManager, playbyplayWebSocketManager } from "./services/websocketManager";
import { dataCache } from "./services/dataCache";
import { startCleanupTask } from "./services/keyMoments";

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

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Start background services
if (!isIISNode) {
  dataCache.startPolling();
  startCleanupTask();
  scoreboardWebSocketManager.startBroadcasting();
  playbyplayWebSocketManager.startBroadcasting();
}

// Start server
if (isIISNode) {
  // IISNode provides PORT as a named pipe
  server.listen(process.env.PORT, () => {
    console.log('Server running under IISNode/Plesk on pipe:', process.env.PORT);
  });
} else {
  // Standard HTTP server for development
  server.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 8000}`);
  });
}

// WebSocket routing
wss.on("connection", (ws, req: any) => {
  const url = req.url;

  if (url === "/api/v1/ws") {
    scoreboardWebSocketManager.handleConnection(ws);
  } else if (url.startsWith("/api/v1/playbyplay/ws/")) {
    const gameId = url.split("/").pop();
    playbyplayWebSocketManager.handleConnection(ws, gameId);
  }
});

// Export server for IISNode
export default server;