"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const websocketManager_1 = require("./services/websocketManager");
const dataCache_1 = require("./services/dataCache");
const keyMoments_1 = require("./services/keyMoments");
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
const isIISNode = !!process.env.IISNODE_VERSION;
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({ origin: "*", credentials: true }));
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
const schedule_1 = __importDefault(require("./routes/schedule"));
const standings_1 = __importDefault(require("./routes/standings"));
const players_1 = __importDefault(require("./routes/players"));
const teams_1 = __importDefault(require("./routes/teams"));
const search_1 = __importDefault(require("./routes/search"));
const predictions_1 = __importDefault(require("./routes/predictions"));
const league_1 = __importDefault(require("./routes/league"));
app.use("/api/v1", schedule_1.default);
app.use("/api/v1", standings_1.default);
app.use("/api/v1", players_1.default);
app.use("/api/v1", teams_1.default);
app.use("/api/v1", search_1.default);
app.use("/api/v1", predictions_1.default);
app.use("/api/v1", league_1.default);
// Create HTTP server
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
// Start background services
if (!isIISNode) {
    dataCache_1.dataCache.startPolling();
    (0, keyMoments_1.startCleanupTask)();
    websocketManager_1.scoreboardWebSocketManager.startBroadcasting();
    websocketManager_1.playbyplayWebSocketManager.startBroadcasting();
}
// Start server
if (isIISNode) {
    // IISNode provides PORT as a named pipe
    server.listen(process.env.PORT, () => {
        console.log('Server running under IISNode/Plesk on pipe:', process.env.PORT);
    });
}
else {
    // Standard HTTP server for development
    server.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on http://localhost:${process.env.PORT || 8000}`);
    });
}
// WebSocket routing
wss.on("connection", (ws, req) => {
    const url = req.url;
    if (url === "/api/v1/ws") {
        websocketManager_1.scoreboardWebSocketManager.handleConnection(ws);
    }
    else if (url.startsWith("/api/v1/playbyplay/ws/")) {
        const gameId = url.split("/").pop();
        websocketManager_1.playbyplayWebSocketManager.handleConnection(ws, gameId);
    }
});
// Export server for IISNode
exports.default = server;
//# sourceMappingURL=index.js.map