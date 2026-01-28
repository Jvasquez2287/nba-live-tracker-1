import WebSocket from 'ws';

/**
 * WebSocket Manager for TypeScript/Node.js API
 * 
 * This manager proxies WebSocket connections to the Python FastAPI backend (nba-tracker-api).
 * The Python backend (app/services/websockets_manager.py) handles all actual WebSocket
 * management, data caching, and broadcasting.
 * 
 * The TypeScript server acts as:
 * 1. HTTP/WebSocket reverse proxy to the Python backend
 * 2. Connection handler that bridges TypeScript WebSocket to Python FastAPI WebSocket
 * 
 * All real logic (data updates, scoring changes, insights, key moments) happens in Python.
 */

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://nba-v1.m-api.net:8000/api/v1';

export class ScoreboardWebSocketManager {
  private activeConnections: Set<WebSocket> = new Set();
  private pythonWebSocketMap: Map<WebSocket, WebSocket> = new Map();

  /**
   * Handle incoming WebSocket connection from client
   * Proxies to Python backend WebSocket at /api/v1/scoreboard/ws
   */
  handleConnection(clientWs: WebSocket): void {
    console.log(`[Scoreboard WS] New client connection - proxying to Python backend`);
    this.activeConnections.add(clientWs);

    // Forward client connection to Python backend WebSocket
    this.connectToPythonBackend(clientWs);

    // Handle client disconnect
    clientWs.on('close', () => {
      this.disconnect(clientWs);
    });

    clientWs.on('error', (error) => {
      console.error('[Scoreboard WS] Client connection error:', error);
      this.disconnect(clientWs);
    });
  }

  /**
   * Establish connection to Python backend WebSocket
   * This maintains a tunnel from client -> TypeScript -> Python backend
   */
  private connectToPythonBackend(clientWs: WebSocket): void {
    try {
      const pythonWsUrl = PYTHON_API_URL.replace('http', 'ws') + '/scoreboard/ws';
      console.log(`[Scoreboard WS] Connecting to Python backend: ${pythonWsUrl}`);

      const pythonWs = new WebSocket(pythonWsUrl);

      // Map the connection pair
      this.pythonWebSocketMap.set(clientWs, pythonWs);

      pythonWs.on('open', () => {
        console.log('[Scoreboard WS] ✅ Connected to Python backend');
      });

      // Forward messages from Python backend to client
      pythonWs.on('message', (data) => {
        try {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
            console.log('[Scoreboard WS] Forwarded update to client');
          }
        } catch (error) {
          console.error('[Scoreboard WS] Error forwarding message:', error);
        }
      });

      // Handle Python backend disconnect
      pythonWs.on('close', (code, reason) => {
        console.log(`[Scoreboard WS] Python backend disconnected - Code: ${code}, Reason: ${reason}`);
        this.pythonWebSocketMap.delete(clientWs);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(code, reason);
        }
      });

      pythonWs.on('error', (error) => {
        console.error('[Scoreboard WS] Python backend error:', error);
        this.pythonWebSocketMap.delete(clientWs);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1011, 'Backend error');
        }
      });

    } catch (error) {
      console.error('[Scoreboard WS] Error connecting to Python backend:', error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1011, 'Failed to connect to backend');
      }
    }
  }

  disconnect(clientWs: WebSocket): void {
    this.activeConnections.delete(clientWs);
    const pythonWs = this.pythonWebSocketMap.get(clientWs);
    
    if (pythonWs) {
      pythonWs.close();
      this.pythonWebSocketMap.delete(clientWs);
    }
    
    console.log(`[Scoreboard WS] Client disconnected (remaining: ${this.activeConnections.size})`);
  }

  // Placeholder methods for compatibility - actual work is done by Python backend
  startBroadcasting(): void {
    console.log('[Scoreboard WS] Broadcasting manager initialized - proxying to Python backend');
  }

  startCleanupTask(): void {
    console.log('[Scoreboard WS] Cleanup task initialized - delegated to Python backend');
  }

  stopCleanupTask(): void {
    console.log('[Scoreboard WS] Cleanup task stopped');
  }
}

export class PlaybyplayWebSocketManager {
  private activeConnections: Map<string, Set<WebSocket>> = new Map();
  private pythonWebSocketMap: Map<WebSocket, WebSocket> = new Map();

  /**
   * Handle incoming WebSocket connection for a specific game
   * Proxies to Python backend WebSocket at /api/v1/scoreboard/playbyplay/ws/{gameId}
   */
  handleConnection(gameId: string, clientWs: WebSocket): void {
    console.log(`[PlayByPlay WS] New client connection for game ${gameId} - proxying to Python backend`);

    if (!this.activeConnections.has(gameId)) {
      this.activeConnections.set(gameId, new Set());
    }

    const gameConnections = this.activeConnections.get(gameId)!;
    gameConnections.add(clientWs);

    // Forward client connection to Python backend WebSocket
    this.connectToPythonBackend(gameId, clientWs);

    // Handle client disconnect
    clientWs.on('close', () => {
      this.disconnect(gameId, clientWs);
    });

    clientWs.on('error', (error) => {
      console.error(`[PlayByPlay WS] Client error for game ${gameId}:`, error);
      this.disconnect(gameId, clientWs);
    });
  }

  /**
   * Establish connection to Python backend WebSocket for specific game
   */
  private connectToPythonBackend(gameId: string, clientWs: WebSocket): void {
    try {
      const pythonWsUrl = PYTHON_API_URL.replace('http', 'ws') + `/scoreboard/playbyplay/ws/${gameId}`;
      console.log(`[PlayByPlay WS] Connecting to Python backend for game ${gameId}: ${pythonWsUrl}`);

      const pythonWs = new WebSocket(pythonWsUrl);

      // Map the connection pair
      this.pythonWebSocketMap.set(clientWs, pythonWs);

      pythonWs.on('open', () => {
        console.log(`[PlayByPlay WS] ✅ Connected to Python backend for game ${gameId}`);
      });

      // Forward messages from Python backend to client
      pythonWs.on('message', (data) => {
        try {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
            console.log(`[PlayByPlay WS] Forwarded update for game ${gameId} to client`);
          }
        } catch (error) {
          console.error(`[PlayByPlay WS] Error forwarding message for game ${gameId}:`, error);
        }
      });

      // Handle Python backend disconnect
      pythonWs.on('close', (code, reason) => {
        console.log(`[PlayByPlay WS] Python backend disconnected for game ${gameId} - Code: ${code}, Reason: ${reason}`);
        this.pythonWebSocketMap.delete(clientWs);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(code, reason);
        }
      });

      pythonWs.on('error', (error) => {
        console.error(`[PlayByPlay WS] Python backend error for game ${gameId}:`, error);
        this.pythonWebSocketMap.delete(clientWs);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1011, 'Backend error');
        }
      });

    } catch (error) {
      console.error(`[PlayByPlay WS] Error connecting to Python backend for game ${gameId}:`, error);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1011, 'Failed to connect to backend');
      }
    }
  }

  disconnect(gameId: string, clientWs: WebSocket): void {
    const gameConnections = this.activeConnections.get(gameId);
    if (gameConnections) {
      gameConnections.delete(clientWs);
      console.log(`[PlayByPlay WS] Client disconnected from game ${gameId} (remaining: ${gameConnections.size})`);

      // Remove game if no more connections
      if (gameConnections.size === 0) {
        this.activeConnections.delete(gameId);
        console.log(`[PlayByPlay WS] Stopped tracking game ${gameId}`);
      }
    }

    const pythonWs = this.pythonWebSocketMap.get(clientWs);
    if (pythonWs) {
      pythonWs.close();
      this.pythonWebSocketMap.delete(clientWs);
    }
  }

  // Placeholder methods for compatibility - actual work is done by Python backend
  startBroadcasting(): void {
    console.log('[PlayByPlay WS] Broadcasting manager initialized - proxying to Python backend');
  }

  startCleanupTask(): void {
    console.log('[PlayByPlay WS] Cleanup task initialized - delegated to Python backend');
  }

  stopCleanupTask(): void {
    console.log('[PlayByPlay WS] Cleanup task stopped');
  }
}

export const scoreboardWebSocketManager = new ScoreboardWebSocketManager();
export const playbyplayWebSocketManager = new PlaybyplayWebSocketManager();
