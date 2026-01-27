"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playbyplayWebSocketManager = exports.scoreboardWebSocketManager = exports.PlaybyplayWebSocketManager = exports.ScoreboardWebSocketManager = void 0;
const ws_1 = __importDefault(require("ws"));
const dataCache_1 = require("./dataCache");
class ScoreboardWebSocketManager {
    constructor() {
        this.activeConnections = new Set();
        this.broadcastInterval = null;
        this.cleanupInterval = null;
        this.BROADCAST_INTERVAL = 8000; // 8 seconds - match scoreboard poll interval
        this.CLEANUP_INTERVAL = 30000; // 30 seconds - clean up dead connections
    }
    connect(websocket) {
        this.activeConnections.add(websocket);
        console.log(`[Scoreboard WS] New client connected (total: ${this.activeConnections.size})`);
        // Send initial data to new client
        this.sendInitialData(websocket);
        // Handle client disconnect
        websocket.on('close', () => {
            this.disconnect(websocket);
        });
        websocket.on('error', (error) => {
            console.error('[Scoreboard WS] Client error:', error);
            this.disconnect(websocket);
        });
    }
    async sendInitialData(websocket) {
        try {
            const scoreboardData = await dataCache_1.dataCache.getScoreboard();
            if (scoreboardData && websocket.readyState === ws_1.default.OPEN) {
                websocket.send(JSON.stringify({
                    type: 'scoreboard',
                    timestamp: new Date().toISOString(),
                    data: scoreboardData
                }));
            }
        }
        catch (error) {
            console.error('[Scoreboard WS] Error sending initial data:', error);
        }
    }
    disconnect(websocket) {
        this.activeConnections.delete(websocket);
        console.log(`[Scoreboard WS] Client disconnected (remaining: ${this.activeConnections.size})`);
    }
    handleConnection(websocket) {
        this.connect(websocket);
    }
    async broadcast(data) {
        if (this.activeConnections.size === 0)
            return;
        const message = JSON.stringify({
            type: 'scoreboard',
            timestamp: new Date().toISOString(),
            data: data
        });
        const disconnectedClients = [];
        for (const client of this.activeConnections) {
            try {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(message);
                }
                else {
                    disconnectedClients.push(client);
                }
            }
            catch (error) {
                console.error('[Scoreboard WS] Error sending to client:', error);
                disconnectedClients.push(client);
            }
        }
        // Clean up disconnected clients
        disconnectedClients.forEach(client => this.activeConnections.delete(client));
    }
    startBroadcasting() {
        if (this.broadcastInterval)
            return;
        console.log('[Scoreboard WS] Broadcasting started');
        const broadcast = async () => {
            try {
                const scoreboardData = await dataCache_1.dataCache.getScoreboard();
                if (scoreboardData) {
                    await this.broadcast(scoreboardData);
                }
            }
            catch (error) {
                console.error('[Scoreboard WS] Error in broadcast loop:', error);
            }
        };
        // Initial broadcast
        broadcast();
        // Set up periodic broadcasting
        this.broadcastInterval = setInterval(broadcast, this.BROADCAST_INTERVAL);
    }
    startCleanupTask() {
        if (this.cleanupInterval)
            return;
        console.log('[Scoreboard WS] Cleanup task started');
        const cleanup = () => {
            const deadConnections = [];
            for (const client of this.activeConnections) {
                if (client.readyState !== ws_1.default.OPEN) {
                    deadConnections.push(client);
                }
            }
            deadConnections.forEach(client => {
                this.activeConnections.delete(client);
                console.log(`[Scoreboard WS] Cleaned up dead connection (remaining: ${this.activeConnections.size})`);
            });
        };
        this.cleanupInterval = setInterval(cleanup, this.CLEANUP_INTERVAL);
    }
    stopCleanupTask() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('[Scoreboard WS] Cleanup task stopped');
        }
        if (this.broadcastInterval) {
            clearInterval(this.broadcastInterval);
            this.broadcastInterval = null;
            console.log('[Scoreboard WS] Broadcasting stopped');
        }
    }
    getConnectionCount() {
        return this.activeConnections.size;
    }
}
exports.ScoreboardWebSocketManager = ScoreboardWebSocketManager;
class PlaybyplayWebSocketManager {
    constructor() {
        this.activeConnections = new Map();
        this.broadcastIntervals = new Map();
        this.cleanupInterval = null;
        this.BROADCAST_INTERVAL = 5000; // 5 seconds - match play-by-play poll interval
        this.CLEANUP_INTERVAL = 30000; // 30 seconds - clean up dead connections
    }
    connect(gameId, websocket) {
        if (!this.activeConnections.has(gameId)) {
            this.activeConnections.set(gameId, new Set());
            console.log(`[PlayByPlay WS] New game tracked: ${gameId}`);
            this.startGameBroadcasting(gameId);
        }
        const gameConnections = this.activeConnections.get(gameId);
        gameConnections.add(websocket);
        console.log(`[PlayByPlay WS] New client for game ${gameId} (total: ${gameConnections.size})`);
        // Send initial data to new client
        this.sendInitialData(gameId, websocket);
        // Handle client disconnect
        websocket.on('close', () => {
            this.disconnect(gameId, websocket);
        });
        websocket.on('error', (error) => {
            console.error(`[PlayByPlay WS] Client error for game ${gameId}:`, error);
            this.disconnect(gameId, websocket);
        });
    }
    async sendInitialData(gameId, websocket) {
        try {
            const playbyplayData = await dataCache_1.dataCache.getPlaybyplay(gameId);
            if (playbyplayData && websocket.readyState === ws_1.default.OPEN) {
                websocket.send(JSON.stringify({
                    type: 'playbyplay',
                    gameId: gameId,
                    timestamp: new Date().toISOString(),
                    data: playbyplayData
                }));
            }
        }
        catch (error) {
            console.error(`[PlayByPlay WS] Error sending initial data for game ${gameId}:`, error);
        }
    }
    disconnect(gameId, websocket) {
        const gameConnections = this.activeConnections.get(gameId);
        if (gameConnections) {
            gameConnections.delete(websocket);
            console.log(`[PlayByPlay WS] Client disconnected from game ${gameId} (remaining: ${gameConnections.size})`);
            // Remove game if no more connections
            if (gameConnections.size === 0) {
                this.activeConnections.delete(gameId);
                const interval = this.broadcastIntervals.get(gameId);
                if (interval) {
                    clearInterval(interval);
                    this.broadcastIntervals.delete(gameId);
                    console.log(`[PlayByPlay WS] Stopped broadcasting for game ${gameId}`);
                }
            }
        }
    }
    handleConnection(websocket, gameId) {
        this.connect(gameId, websocket);
    }
    async broadcast(gameId, data) {
        const gameConnections = this.activeConnections.get(gameId);
        if (!gameConnections || gameConnections.size === 0)
            return;
        const message = JSON.stringify({
            type: 'playbyplay',
            gameId: gameId,
            timestamp: new Date().toISOString(),
            data: data
        });
        const disconnectedClients = [];
        for (const client of gameConnections) {
            try {
                if (client.readyState === ws_1.default.OPEN) {
                    client.send(message);
                }
                else {
                    disconnectedClients.push(client);
                }
            }
            catch (error) {
                console.error(`[PlayByPlay WS] Error sending to client for game ${gameId}:`, error);
                disconnectedClients.push(client);
            }
        }
        // Clean up disconnected clients
        disconnectedClients.forEach(client => {
            gameConnections.delete(client);
        });
        if (gameConnections.size === 0) {
            this.activeConnections.delete(gameId);
            const interval = this.broadcastIntervals.get(gameId);
            if (interval) {
                clearInterval(interval);
                this.broadcastIntervals.delete(gameId);
            }
        }
    }
    startGameBroadcasting(gameId) {
        if (this.broadcastIntervals.has(gameId))
            return;
        const broadcast = async () => {
            try {
                const playbyplayData = await dataCache_1.dataCache.getPlaybyplay(gameId);
                if (playbyplayData) {
                    await this.broadcast(gameId, playbyplayData);
                }
            }
            catch (error) {
                console.error(`[PlayByPlay WS] Error in broadcast loop for game ${gameId}:`, error);
            }
        };
        // Initial broadcast
        broadcast();
        // Set up periodic broadcasting
        const interval = setInterval(broadcast, this.BROADCAST_INTERVAL);
        this.broadcastIntervals.set(gameId, interval);
    }
    startBroadcasting() {
        console.log('[PlayByPlay WS] Broadcasting manager initialized (games start broadcasting on client connection)');
    }
    startCleanupTask() {
        if (this.cleanupInterval)
            return;
        console.log('[PlayByPlay WS] Cleanup task started');
        const cleanup = () => {
            let deadConnectionsCount = 0;
            for (const [gameId, connections] of this.activeConnections.entries()) {
                const deadConnections = [];
                for (const client of connections) {
                    if (client.readyState !== ws_1.default.OPEN) {
                        deadConnections.push(client);
                    }
                }
                deadConnections.forEach(client => {
                    connections.delete(client);
                    deadConnectionsCount++;
                });
                // Remove game if no more connections
                if (connections.size === 0) {
                    this.activeConnections.delete(gameId);
                    const interval = this.broadcastIntervals.get(gameId);
                    if (interval) {
                        clearInterval(interval);
                        this.broadcastIntervals.delete(gameId);
                    }
                }
            }
            if (deadConnectionsCount > 0) {
                console.log(`[PlayByPlay WS] Cleaned up ${deadConnectionsCount} dead connections`);
            }
        };
        this.cleanupInterval = setInterval(cleanup, this.CLEANUP_INTERVAL);
    }
    stopCleanupTask() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('[PlayByPlay WS] Cleanup task stopped');
        }
        // Stop all game broadcasting
        for (const [gameId, interval] of this.broadcastIntervals.entries()) {
            clearInterval(interval);
        }
        this.broadcastIntervals.clear();
        // Close all connections
        for (const connections of this.activeConnections.values()) {
            for (const client of connections) {
                if (client.readyState === ws_1.default.OPEN) {
                    client.close();
                }
            }
        }
        this.activeConnections.clear();
        console.log('[PlayByPlay WS] All connections closed');
    }
    getConnectionCount(gameId) {
        if (gameId) {
            return this.activeConnections.get(gameId)?.size || 0;
        }
        let total = 0;
        for (const connections of this.activeConnections.values()) {
            total += connections.size;
        }
        return total;
    }
    getGameCount() {
        return this.activeConnections.size;
    }
}
exports.PlaybyplayWebSocketManager = PlaybyplayWebSocketManager;
exports.scoreboardWebSocketManager = new ScoreboardWebSocketManager();
exports.playbyplayWebSocketManager = new PlaybyplayWebSocketManager();
//# sourceMappingURL=websocketManager.js.map