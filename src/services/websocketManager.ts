import WebSocket from 'ws';
import { dataCache } from './dataCache';

export class ScoreboardWebSocketManager {
  private activeConnections: Set<WebSocket> = new Set();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly BROADCAST_INTERVAL = 8000; // 8 seconds - match scoreboard poll interval
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds - clean up dead connections

  connect(websocket: WebSocket): void {
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

  private async sendInitialData(websocket: WebSocket): Promise<void> {
    try {
      const scoreboardData = await dataCache.getScoreboard();
      if (scoreboardData && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'scoreboard',
          timestamp: new Date().toISOString(),
          data: scoreboardData
        }));
      }
    } catch (error) {
      console.error('[Scoreboard WS] Error sending initial data:', error);
    }
  }

  disconnect(websocket: WebSocket): void {
    this.activeConnections.delete(websocket);
    console.log(`[Scoreboard WS] Client disconnected (remaining: ${this.activeConnections.size})`);
  }

  handleConnection(websocket: WebSocket): void {
    this.connect(websocket);
  }

  async broadcast(data: any): Promise<void> {
    if (this.activeConnections.size === 0) return;

    const message = JSON.stringify({
      type: 'scoreboard',
      timestamp: new Date().toISOString(),
      data: data
    });

    const disconnectedClients: WebSocket[] = [];

    for (const client of this.activeConnections) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          disconnectedClients.push(client);
        }
      } catch (error) {
        console.error('[Scoreboard WS] Error sending to client:', error);
        disconnectedClients.push(client);
      }
    }

    // Clean up disconnected clients
    disconnectedClients.forEach(client => this.activeConnections.delete(client));
  }

  startBroadcasting(): void {
    if (this.broadcastInterval) return;

    console.log('[Scoreboard WS] Broadcasting started');

    const broadcast = async () => {
      try {
        const scoreboardData = await dataCache.getScoreboard();
        if (scoreboardData) {
          await this.broadcast(scoreboardData);
        }
      } catch (error) {
        console.error('[Scoreboard WS] Error in broadcast loop:', error);
      }
    };

    // Initial broadcast
    broadcast();

    // Set up periodic broadcasting
    this.broadcastInterval = setInterval(broadcast, this.BROADCAST_INTERVAL);
  }

  startCleanupTask(): void {
    if (this.cleanupInterval) return;

    console.log('[Scoreboard WS] Cleanup task started');

    const cleanup = () => {
      const deadConnections: WebSocket[] = [];

      for (const client of this.activeConnections) {
        if (client.readyState !== WebSocket.OPEN) {
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

  stopCleanupTask(): void {
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

  getConnectionCount(): number {
    return this.activeConnections.size;
  }
}

export class PlaybyplayWebSocketManager {
  private activeConnections: Map<string, Set<WebSocket>> = new Map();
  private broadcastIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly BROADCAST_INTERVAL = 5000; // 5 seconds - match play-by-play poll interval
  private readonly CLEANUP_INTERVAL = 30000; // 30 seconds - clean up dead connections

  connect(gameId: string, websocket: WebSocket): void {
    if (!this.activeConnections.has(gameId)) {
      this.activeConnections.set(gameId, new Set());
      console.log(`[PlayByPlay WS] New game tracked: ${gameId}`);
      this.startGameBroadcasting(gameId);
    }

    const gameConnections = this.activeConnections.get(gameId)!;
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

  private async sendInitialData(gameId: string, websocket: WebSocket): Promise<void> {
    try {
      const playbyplayData = await dataCache.getPlaybyplay(gameId);
      if (playbyplayData && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'playbyplay',
          gameId: gameId,
          timestamp: new Date().toISOString(),
          data: playbyplayData
        }));
      }
    } catch (error) {
      console.error(`[PlayByPlay WS] Error sending initial data for game ${gameId}:`, error);
    }
  }

  disconnect(gameId: string, websocket: WebSocket): void {
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

  handleConnection(websocket: WebSocket, gameId: string): void {
    this.connect(gameId, websocket);
  }

  async broadcast(gameId: string, data: any): Promise<void> {
    const gameConnections = this.activeConnections.get(gameId);
    if (!gameConnections || gameConnections.size === 0) return;

    const message = JSON.stringify({
      type: 'playbyplay',
      gameId: gameId,
      timestamp: new Date().toISOString(),
      data: data
    });

    const disconnectedClients: WebSocket[] = [];

    for (const client of gameConnections) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          disconnectedClients.push(client);
        }
      } catch (error) {
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

  private startGameBroadcasting(gameId: string): void {
    if (this.broadcastIntervals.has(gameId)) return;

    const broadcast = async () => {
      try {
        const playbyplayData = await dataCache.getPlaybyplay(gameId);
        if (playbyplayData) {
          await this.broadcast(gameId, playbyplayData);
        }
      } catch (error) {
        console.error(`[PlayByPlay WS] Error in broadcast loop for game ${gameId}:`, error);
      }
    };

    // Initial broadcast
    broadcast();

    // Set up periodic broadcasting
    const interval = setInterval(broadcast, this.BROADCAST_INTERVAL);
    this.broadcastIntervals.set(gameId, interval);
  }

  startBroadcasting(): void {
    console.log('[PlayByPlay WS] Broadcasting manager initialized (games start broadcasting on client connection)');
  }

  startCleanupTask(): void {
    if (this.cleanupInterval) return;

    console.log('[PlayByPlay WS] Cleanup task started');

    const cleanup = () => {
      let deadConnectionsCount = 0;

      for (const [gameId, connections] of this.activeConnections.entries()) {
        const deadConnections: WebSocket[] = [];

        for (const client of connections) {
          if (client.readyState !== WebSocket.OPEN) {
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

  stopCleanupTask(): void {
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
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      }
    }
    this.activeConnections.clear();

    console.log('[PlayByPlay WS] All connections closed');
  }

  getConnectionCount(gameId?: string): number {
    if (gameId) {
      return this.activeConnections.get(gameId)?.size || 0;
    }
    let total = 0;
    for (const connections of this.activeConnections.values()) {
      total += connections.size;
    }
    return total;
  }

  getGameCount(): number {
    return this.activeConnections.size;
  }
}

export const scoreboardWebSocketManager = new ScoreboardWebSocketManager();
export const playbyplayWebSocketManager = new PlaybyplayWebSocketManager();