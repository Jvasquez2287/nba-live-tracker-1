import WebSocket from 'ws';

export class ScoreboardWebSocketManager {
  private activeConnections: Set<WebSocket> = new Set();

  connect(websocket: WebSocket): void {
    this.activeConnections.add(websocket);
    console.log('New scoreboard client connected');
  }

  disconnect(websocket: WebSocket): void {
    this.activeConnections.delete(websocket);
    console.log('Scoreboard client disconnected');
  }

  handleConnection(websocket: WebSocket): void {
    this.connect(websocket);
  }

  async broadcast(data: any): Promise<void> {
    const message = JSON.stringify(data);
    const disconnectedClients: WebSocket[] = [];

    for (const client of this.activeConnections) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          disconnectedClients.push(client);
        }
      } catch (error) {
        console.error('Error sending to scoreboard client:', error);
        disconnectedClients.push(client);
      }
    }

    // Clean up disconnected clients
    disconnectedClients.forEach(client => this.activeConnections.delete(client));
  }

  startBroadcasting(): void {
    console.log('Scoreboard broadcasting started');
  }

  startCleanupTask(): void {
    console.log('Scoreboard cleanup task started');
  }

  stopCleanupTask(): void {
    console.log('Scoreboard cleanup task stopped');
  }

  getConnectionCount(): number {
    return this.activeConnections.size;
  }
}

export class PlaybyplayWebSocketManager {
  private activeConnections: Map<string, Set<WebSocket>> = new Map();

  connect(gameId: string, websocket: WebSocket): void {
    if (!this.activeConnections.has(gameId)) {
      this.activeConnections.set(gameId, new Set());
    }
    this.activeConnections.get(gameId)!.add(websocket);
    console.log(`New play-by-play client connected for game ${gameId}`);
  }

  disconnect(gameId: string, websocket: WebSocket): void {
    const gameConnections = this.activeConnections.get(gameId);
    if (gameConnections) {
      gameConnections.delete(websocket);
      if (gameConnections.size === 0) {
        this.activeConnections.delete(gameId);
      }
    }
    console.log(`Play-by-play client disconnected from game ${gameId}`);
  }

  handleConnection(websocket: WebSocket, gameId: string): void {
    this.connect(gameId, websocket);
  }

  async broadcast(gameId: string, data: any): Promise<void> {
    const gameConnections = this.activeConnections.get(gameId);
    if (!gameConnections) return;

    const message = JSON.stringify(data);
    const disconnectedClients: WebSocket[] = [];

    for (const client of gameConnections) {
      try {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        } else {
          disconnectedClients.push(client);
        }
      } catch (error) {
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

  startBroadcasting(): void {
    console.log('Play-by-play broadcasting started');
  }

  startCleanupTask(): void {
    console.log('Play-by-play cleanup task started');
  }

  stopCleanupTask(): void {
    console.log('Play-by-play cleanup task stopped');
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
}

export const scoreboardWebSocketManager = new ScoreboardWebSocketManager();
export const playbyplayWebSocketManager = new PlaybyplayWebSocketManager();