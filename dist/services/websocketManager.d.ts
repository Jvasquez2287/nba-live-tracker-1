import WebSocket from 'ws';
export declare class ScoreboardWebSocketManager {
    private activeConnections;
    private broadcastInterval;
    private cleanupInterval;
    private readonly BROADCAST_INTERVAL;
    private readonly CLEANUP_INTERVAL;
    connect(websocket: WebSocket): void;
    private sendInitialData;
    disconnect(websocket: WebSocket): void;
    handleConnection(websocket: WebSocket): void;
    broadcast(data: any): Promise<void>;
    startBroadcasting(): void;
    startCleanupTask(): void;
    stopCleanupTask(): void;
    getConnectionCount(): number;
}
export declare class PlaybyplayWebSocketManager {
    private activeConnections;
    private broadcastIntervals;
    private cleanupInterval;
    private readonly BROADCAST_INTERVAL;
    private readonly CLEANUP_INTERVAL;
    connect(gameId: string, websocket: WebSocket): void;
    private sendInitialData;
    disconnect(gameId: string, websocket: WebSocket): void;
    handleConnection(websocket: WebSocket, gameId: string): void;
    broadcast(gameId: string, data: any): Promise<void>;
    private startGameBroadcasting;
    startBroadcasting(): void;
    startCleanupTask(): void;
    stopCleanupTask(): void;
    getConnectionCount(gameId?: string): number;
    getGameCount(): number;
}
export declare const scoreboardWebSocketManager: ScoreboardWebSocketManager;
export declare const playbyplayWebSocketManager: PlaybyplayWebSocketManager;
//# sourceMappingURL=websocketManager.d.ts.map