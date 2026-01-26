"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playbyplayWebSocketManager = exports.scoreboardWebSocketManager = exports.PlaybyplayWebSocketManager = exports.ScoreboardWebSocketManager = void 0;
const ws_1 = __importDefault(require("ws"));
class ScoreboardWebSocketManager {
    constructor() {
        this.activeConnections = new Set();
    }
    connect(websocket) {
        this.activeConnections.add(websocket);
        console.log('New scoreboard client connected');
    }
    disconnect(websocket) {
        this.activeConnections.delete(websocket);
        console.log('Scoreboard client disconnected');
    }
    handleConnection(websocket) {
        this.connect(websocket);
    }
    async broadcast(data) {
        const message = JSON.stringify(data);
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
                console.error('Error sending to scoreboard client:', error);
                disconnectedClients.push(client);
            }
        }
        // Clean up disconnected clients
        disconnectedClients.forEach(client => this.activeConnections.delete(client));
    }
    startBroadcasting() {
        console.log('Scoreboard broadcasting started');
    }
    startCleanupTask() {
        console.log('Scoreboard cleanup task started');
    }
    stopCleanupTask() {
        console.log('Scoreboard cleanup task stopped');
    }
    getConnectionCount() {
        return this.activeConnections.size;
    }
}
exports.ScoreboardWebSocketManager = ScoreboardWebSocketManager;
class PlaybyplayWebSocketManager {
    constructor() {
        this.activeConnections = new Map();
    }
    connect(gameId, websocket) {
        if (!this.activeConnections.has(gameId)) {
            this.activeConnections.set(gameId, new Set());
        }
        this.activeConnections.get(gameId).add(websocket);
        console.log(`New play-by-play client connected for game ${gameId}`);
    }
    disconnect(gameId, websocket) {
        const gameConnections = this.activeConnections.get(gameId);
        if (gameConnections) {
            gameConnections.delete(websocket);
            if (gameConnections.size === 0) {
                this.activeConnections.delete(gameId);
            }
        }
        console.log(`Play-by-play client disconnected from game ${gameId}`);
    }
    handleConnection(websocket, gameId) {
        this.connect(gameId, websocket);
    }
    async broadcast(gameId, data) {
        const gameConnections = this.activeConnections.get(gameId);
        if (!gameConnections)
            return;
        const message = JSON.stringify(data);
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
                console.error('Error sending to play-by-play client:', error);
                disconnectedClients.push(client);
            }
        }
        // Clean up disconnected clients
        disconnectedClients.forEach(client => {
            gameConnections.delete(client);
        });
        if (gameConnections.size === 0) {
            this.activeConnections.delete(gameId);
        }
    }
    startBroadcasting() {
        console.log('Play-by-play broadcasting started');
    }
    startCleanupTask() {
        console.log('Play-by-play cleanup task started');
    }
    stopCleanupTask() {
        console.log('Play-by-play cleanup task stopped');
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
}
exports.PlaybyplayWebSocketManager = PlaybyplayWebSocketManager;
exports.scoreboardWebSocketManager = new ScoreboardWebSocketManager();
exports.playbyplayWebSocketManager = new PlaybyplayWebSocketManager();
//# sourceMappingURL=websocketManager.js.map