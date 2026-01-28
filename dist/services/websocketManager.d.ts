import WebSocket from 'ws';
export declare class ScoreboardWebSocketManager {
    private activeConnections;
    private pythonWebSocketMap;
    /**
     * Handle incoming WebSocket connection from client
     * Proxies to Python backend WebSocket at /api/v1/scoreboard/ws
     */
    handleConnection(clientWs: WebSocket): void;
    /**
     * Establish connection to Python backend WebSocket
     * This maintains a tunnel from client -> TypeScript -> Python backend
     */
    private connectToPythonBackend;
    disconnect(clientWs: WebSocket): void;
    startBroadcasting(): void;
    startCleanupTask(): void;
    stopCleanupTask(): void;
}
export declare class PlaybyplayWebSocketManager {
    private activeConnections;
    private pythonWebSocketMap;
    /**
     * Handle incoming WebSocket connection for a specific game
     * Proxies to Python backend WebSocket at /api/v1/scoreboard/playbyplay/ws/{gameId}
     */
    handleConnection(gameId: string, clientWs: WebSocket): void;
    /**
     * Establish connection to Python backend WebSocket for specific game
     */
    private connectToPythonBackend;
    disconnect(gameId: string, clientWs: WebSocket): void;
    startBroadcasting(): void;
    startCleanupTask(): void;
    stopCleanupTask(): void;
}
export declare const scoreboardWebSocketManager: ScoreboardWebSocketManager;
export declare const playbyplayWebSocketManager: PlaybyplayWebSocketManager;
//# sourceMappingURL=websocketManager.d.ts.map