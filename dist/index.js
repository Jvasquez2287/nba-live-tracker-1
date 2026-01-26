"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
// Debug logging for IISNode
console.log('NBA API Server starting...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('IISNode version:', process.env.IISNODE_VERSION || 'Not running under IISNode');
console.log('PORT env:', process.env.PORT || 'Not set');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
// Check for IIS/Plesk environment
const isIISNode = !!(process.env.IISNODE_VERSION ||
    process.env.APP_POOL_ID ||
    process.env.IIS_BIN ||
    process.env.IIS_SITE_NAME ||
    process.env.PLESK_BIN ||
    process.env.PLESK_CONFIG ||
    (process.cwd() && process.cwd().includes('Inetpub\\vhosts')) || // Plesk path detection
    (process.cwd() && process.cwd().includes('inetpub/vhosts')) || // Case insensitive
    (process.env.PORT && process.env.PORT !== '8000') ||
    (process.env.NODE_ENV === 'production' && !process.env.PORT) || // Production without explicit PORT
    require.main !== module // If loaded as module (IISNode style)
);
console.log('Module check - require.main === module:', require.main === module);
console.log('Environment variables check:');
console.log('- IISNODE_VERSION:', process.env.IISNODE_VERSION);
console.log('- APP_POOL_ID:', process.env.APP_POOL_ID);
console.log('- IIS_BIN:', process.env.IIS_BIN);
console.log('- IIS_SITE_NAME:', process.env.IIS_SITE_NAME);
console.log('- PLESK_BIN:', process.env.PLESK_BIN);
console.log('- PLESK_CONFIG:', process.env.PLESK_CONFIG);
console.log('- CWD contains vhosts:', process.cwd() && (process.cwd().includes('Inetpub\\vhosts') || process.cwd().includes('inetpub/vhosts')));
console.log('- NODE_ENV:', process.env.NODE_ENV);
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
// Also try loading from current working directory (for IISNode compatibility)
dotenv_1.default.config();
// Additional fallback for IISNode
if (isIISNode) {
    dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
}
// Additional fallback for IISNode
if (isIISNode) {
    dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
}
// Import services
const dataCache_1 = require("./services/dataCache");
const websocketManager_1 = require("./services/websocketManager");
const keyMoments_1 = require("./services/keyMoments");
// Import routes
const schedule_1 = __importDefault(require("./routes/schedule"));
const standings_1 = __importDefault(require("./routes/standings"));
const players_1 = __importDefault(require("./routes/players"));
const teams_1 = __importDefault(require("./routes/teams"));
const search_1 = __importDefault(require("./routes/search"));
const predictions_1 = __importDefault(require("./routes/predictions"));
const league_1 = __importDefault(require("./routes/league"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || '*';
let allowedOrigins;
if (frontendUrl === '*') {
    allowedOrigins = ['*'];
}
else {
    allowedOrigins = [frontendUrl];
    if (!frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
        allowedOrigins.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173');
    }
}
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Health check endpoint - available immediately
app.get('/', (req, res) => {
    res.json({
        message: 'NBA Live API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        iisnode: isIISNode
    });
});
// Config check endpoint
app.get('/api/v1/config/check', (req, res) => {
    const groqKey = process.env.GROQ_API_KEY;
    res.json({
        groq_configured: !!groqKey,
        groq_key_length: groqKey ? groqKey.length : 0,
        environment: process.env.NODE_ENV || 'development',
        iisnode: isIISNode
    });
});
// API routes
console.log('Loading API routes...');
// app.use('/api/v1', scoreboardRoutes);
console.log('Scoreboard routes loaded');
app.use('/api/v1', schedule_1.default);
app.use('/api/v1', standings_1.default);
app.use('/api/v1', players_1.default);
app.use('/api/v1', teams_1.default);
app.use('/api/v1', search_1.default);
app.use('/api/v1', predictions_1.default);
app.use('/api/v1', league_1.default);
console.log('All API routes loaded');
// Scoreboard route
app.get('/api/v1/scoreboard', async (req, res) => {
    try {
        const scoreboard = await dataCache_1.dataCache.getScoreboard();
        if (!scoreboard) {
            return res.status(503).json({ error: 'Scoreboard data not available' });
        }
        res.json(scoreboard);
    }
    catch (error) {
        console.error('Error fetching scoreboard:', error);
        res.status(500).json({ error: 'Failed to fetch scoreboard' });
    }
});
// WebSocket handling
wss.on('connection', (ws, req) => {
    const url = req.url;
    if (url === '/api/v1/ws') {
        websocketManager_1.scoreboardWebSocketManager.handleConnection(ws);
    }
    else if (url?.startsWith('/api/v1/playbyplay/ws/')) {
        const gameId = url.split('/').pop();
        if (gameId) {
            websocketManager_1.playbyplayWebSocketManager.handleConnection(ws, gameId);
        }
    }
});
// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await dataCache_1.dataCache.stopPolling();
    await (0, keyMoments_1.stopCleanupTask)();
    await websocketManager_1.scoreboardWebSocketManager.stopCleanupTask();
    await websocketManager_1.playbyplayWebSocketManager.stopCleanupTask();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
// Start server
const PORT = process.env.PORT || 8000;
async function startServer() {
    try {
        console.log('Starting NBA data polling and WebSocket broadcasting...');
        // For IISNode debugging, don't start background services initially
        if (!isIISNode) {
            // Only start background services when not under IISNode
            try {
                dataCache_1.dataCache.startPolling();
                console.log('Data cache polling started');
            }
            catch (error) {
                console.error('Failed to start data cache polling:', error);
            }
            try {
                (0, keyMoments_1.startCleanupTask)();
                console.log('Cleanup task started');
            }
            catch (error) {
                console.error('Failed to start cleanup task:', error);
            }
            try {
                websocketManager_1.scoreboardWebSocketManager.startBroadcasting();
                websocketManager_1.playbyplayWebSocketManager.startBroadcasting();
                console.log('WebSocket broadcasting started');
            }
            catch (error) {
                console.error('Failed to start WebSocket broadcasting:', error);
            }
            try {
                websocketManager_1.scoreboardWebSocketManager.startCleanupTask();
                websocketManager_1.playbyplayWebSocketManager.startCleanupTask();
                console.log('WebSocket cleanup tasks started');
            }
            catch (error) {
                console.error('Failed to start WebSocket cleanup tasks:', error);
            }
        }
        else {
            console.log('Running under IISNode - skipping background services for initial testing');
        }
        // Only listen if not running under IISNode
        if (!isIISNode) {
            server.listen(PORT, () => {
                console.log(`Server running on http://localhost:${PORT}`);
            });
        }
        else {
            console.log('Server configured for IISNode/Plesk');
        }
    }
    catch (error) {
        console.error('Failed to start server:', error);
        // Don't exit in IISNode environment - let IIS handle the error
        if (!isIISNode) {
            process.exit(1);
        }
    }
}
startServer();
// Export the server for IISNode
exports.default = server;
//# sourceMappingURL=index.js.map