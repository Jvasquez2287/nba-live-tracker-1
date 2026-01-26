import WebSocket from 'ws';
export declare class ScoreboardWebSocketManager {
    private activeConnections;
    connect(websocket: WebSocket): void;
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
    connect(gameId: string, websocket: WebSocket): void;
    disconnect(gameId: string, websocket: WebSocket): void;
    handleConnection(websocket: WebSocket, gameId: string): void;
    broadcast(gameId: string, data: any): Promise<void>;
    startBroadcasting(): void;
    startCleanupTask(): void;
    stopCleanupTask(): void;
    getConnectionCount(gameId?: string): number;
}
export declare const scoreboardWebSocketManager: ScoreboardWebSocketManager;
export declare const playbyplayWebSocketManager: PlaybyplayWebSocketManager;
//# sourceMappingURL=websocketManager.d.ts.map