import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Detect IISNode environment - use multiple detection methods
const isIISNode = !!(
  process.env.IISNODE_VERSION ||
  process.env.APP_POOL_ID ||
  process.env.PLESK_BIN ||
  (process.cwd() && process.cwd().includes('vhosts')) ||
  require.main !== module
);

console.log('IISNode detection:', isIISNode);
console.log('IISNODE_VERSION:', process.env.IISNODE_VERSION);
console.log('PLESK_BIN:', process.env.PLESK_BIN);
console.log('CWD:', process.cwd());
console.log('require.main !== module:', require.main !== module);

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

// Cache refresh endpoint
app.post("/api/v1/cache/refresh", async (req, res) => {
  try {
    console.log('Manual cache refresh requested');
    const scoreboardData = await dataCache.refreshScoreboard();
    
    res.json({
      success: true,
      message: "Cache refreshed successfully",
      games: scoreboardData?.scoreboard?.games?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cache status endpoint
app.get("/api/v1/cache/status", async (req, res) => {
  try {
    const scoreboardData = await dataCache.getScoreboard();
    const games = scoreboardData?.scoreboard?.games || [];
    
    res.json({
      cacheStatus: games.length > 0 ? 'populated' : 'empty',
      games: games.length,
      timestamp: new Date().toISOString(),
      lastUpdate: scoreboardData?.scoreboard?.gameDate || 'unknown'
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({
      cacheStatus: 'error',
      error: 'Failed to get cache status'
    });
  }
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

// Import WebSocket managers and services
import {
  scoreboardWebSocketManager,
  playbyplayWebSocketManager
} from "./services/websocketManager";
import { dataCache } from "./services/dataCache";
import { startCleanupTask, stopCleanupTask } from "./services/keyMoments";

// Create HTTP server and WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on("connection", (ws, req: any) => {
  const url = req.url;

  if (url === "/api/v1/ws") {
    scoreboardWebSocketManager.handleConnection(ws);
  } else if (url?.startsWith("/api/v1/playbyplay/ws/")) {
    const gameId = url.split("/").pop();
    if (gameId) {
      playbyplayWebSocketManager.handleConnection(ws, gameId);
    }
  }
});

// Start background tasks only in development
if (!isIISNode) {
  try {
    dataCache.startPolling();
    console.log('Data cache polling started');
  } catch (error) {
    console.error('Error starting data cache:', error);
  }

  try {
    startCleanupTask();
    console.log('Cleanup task started');
  } catch (error) {
    console.error('Error starting cleanup task:', error);
  }

  try {
    scoreboardWebSocketManager.startBroadcasting();
    playbyplayWebSocketManager.startBroadcasting();
    console.log('WebSocket broadcasting started');
  } catch (error) {
    console.error('Error starting WebSocket broadcasting:', error);
  }

  try {
    scoreboardWebSocketManager.startCleanupTask();
    playbyplayWebSocketManager.startCleanupTask();
    console.log('WebSocket cleanup tasks started');
  } catch (error) {
    console.error('Error starting cleanup tasks:', error);
  }
}

// Start server
const PORT = process.env.PORT || 8000;

if (isIISNode) {
  // IISNode provides PORT as a named pipe
  server.listen(PORT, () => {
    console.log('Server running under IISNode on pipe:', PORT);
  });
} else {
  // Development mode
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  await dataCache.stopPolling();
  await stopCleanupTask();
  await scoreboardWebSocketManager.stopCleanupTask();
  await playbyplayWebSocketManager.stopCleanupTask();
  server.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  server.close();
  process.exit(0);
});

// Export server for IISNode
export default server;