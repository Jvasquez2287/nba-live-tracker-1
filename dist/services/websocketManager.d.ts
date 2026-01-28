import WebSocket from 'ws';
export declare class ScoreboardWebSocketManager {
    private activeConnections;
    private broadcastInterval;
    private cleanupInterval;
    private currentGames;
    private lastUpdateTimestamp;
    private lastWinProbUpdate;
    private readonly BROADCAST_INTERVAL;
    private readonly CLEANUP_INTERVAL;
    private readonly MIN_UPDATE_INTERVAL;
    private readonly CLEANUP_THRESHOLD;
    connect(websocket: WebSocket): void;
    private sendInitialData;
    disconnect(websocket: WebSocket): void;
    handleConnection(websocket: WebSocket): void;
    private formatGameResponse;
    private hasGameDataChanged;
    broadcastUpdates(): Promise<void>;
    startBroadcasting(): void;
    startCleanupTask(): void;
    stopCleanupTask(): void;
    getConnectionCount(): number;
}
export declare class PlaybyplayWebSocketManager {
    private activeConnections;
    private broadcastIntervals;
    private cleanupInterval;
    private currentPlaybyplay;
    private lastUpdateTimestamp;
    private readonly BROADCAST_INTERVAL;
    private readonly CLEANUP_INTERVAL;
    private readonly MIN_UPDATE_INTERVAL;
    private readonly CLEANUP_THRESHOLD;
    connect(gameId: string, websocket: WebSocket): void;
    private sendInitialData;
    disconnect(gameId: string, websocket: WebSocket): void;
    handleConnection(websocket: WebSocket, gameId: string): void;
    private hasPlaybyplayChanged;
    private broadcastPlaybyplayUpdates;
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