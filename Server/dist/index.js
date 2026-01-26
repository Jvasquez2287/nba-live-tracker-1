// src/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';

// Services
import { dataCache } from './services/dataCache';
import {
  scoreboardWebSocketManager,
  playbyplayWebSocketManager,
} from './services/websocketManager';
import { startCleanupTask, stopCleanupTask } from './services/keyMoments';

// Routes
import scoreboardRoutes from './routes/scoreboard';
import scheduleRoutes from './routes/schedule';
import standingsRoutes from './routes/standings';
import playersRoutes from './routes/players';
import teamsRoutes from './routes/teams';
import searchRoutes from './routes/search';
import predictionsRoutes from './routes/predictions';
import leagueRoutes from './routes/league';

// --------------------------------------------------
// Environment & diagnostics
// --------------------------------------------------

console.log('NBA API Server starting...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('IISNode version:', process.env.IISNODE_VERSION || 'Not running under IISNode');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Load env from site root (works for IISNode + local)
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Optional fallback to project root (for local dev with src/dist)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// --------------------------------------------------
// App setup
// --------------------------------------------------

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const frontendUrl = process.env.FRONTEND_URL || '*';
let allowedOrigins: string[] | string = '*';

if (frontendUrl === '*') {
  allowedOrigins = '*';
} else {
  const origins = new Set<string>([frontendUrl]);

  if (!frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
    [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ].forEach(o => origins.add(o));
  }

  allowedOrigins = Array.from(origins);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// --------------------------------------------------
// Health & config endpoints
// --------------------------------------------------

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'NBA Live API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    iisnode: !!process.env.IISNODE_VERSION,
  });
});

app.get('/api/v1/config/check', (req: Request, res: Response) => {
  const groqKey = process.env.GROQ_API_KEY;
  res.json({
    groq_configured: !!groqKey,
    groq_key_length: groqKey ? groqKey.length : 0,
    environment: process.env.NODE_ENV || 'development',
    iisnode: !!process.env.IISNODE_VERSION,
  });
});

// --------------------------------------------------
// API routes
// --------------------------------------------------

app.use('/api/v1', scoreboardRoutes);
app.use('/api/v1', scheduleRoutes);
app.use('/api/v1', standingsRoutes);
app.use('/api/v1', playersRoutes);
app.use('/api/v1', teamsRoutes);
app.use('/api/v1', searchRoutes);
app.use('/api/v1', predictionsRoutes);
app.use('/api/v1', leagueRoutes);

// --------------------------------------------------
// WebSockets
// --------------------------------------------------

let server: http.Server | null = null;
let wss: WebSocketServer | null = null;

const isIISNode = !!process.env.IISNODE_VERSION;

// Local dev: normal HTTP server + WebSocketServer bound to it
if (!isIISNode) {
  server = http.createServer(app);
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = req.url || '';

    if (url === '/api/v1/ws') {
      scoreboardWebSocketManager.handleConnection(ws);
    } else if (url.startsWith('/api/v1/playbyplay/ws/')) {
      const gameId = url.split('/').pop();
      if (gameId) {
        playbyplayWebSocketManager.handleConnection(ws, gameId);
      }
    }
  });
} else {
  // IISNode: it wraps `app` in its own HTTP server.
  // Use noServer mode and hook into upgrade events.
  wss = new WebSocketServer({ noServer: true });

  app.on('upgrade', (req: any, socket: any, head: any) => {
    const url = req.url || '';

    if (!url.startsWith('/api/v1/ws') && !url.startsWith('/api/v1/playbyplay/ws/')) {
      socket.destroy();
      return;
    }

    wss!.handleUpgrade(req, socket, head, ws => {
      wss!.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws, req: any) => {
    const url = req.url || '';

    if (url === '/api/v1/ws') {
      scoreboardWebSocketManager.handleConnection(ws);
    } else if (url.startsWith('/api/v1/playbyplay/ws/')) {
      const gameId = url.split('/').pop();
      if (gameId) {
        playbyplayWebSocketManager.handleConnection(ws, gameId);
      }
    }
  });
}

// --------------------------------------------------
// Background tasks
// --------------------------------------------------

async function startBackgroundTasks() {
  console.log('Starting NBA data polling and WebSocket broadcasting...');

  try {
    dataCache.startPolling();
    console.log('Data cache polling started');
  } catch (error) {
    console.error('Failed to start data cache polling:', error);
  }

  try {
    startCleanupTask();
    console.log('Key moments cleanup task started');
  } catch (error) {
    console.error('Failed to start key moments cleanup task:', error);
  }

  try {
    scoreboardWebSocketManager.startBroadcasting();
    playbyplayWebSocketManager.startBroadcasting();
    console.log('WebSocket broadcasting started');
  } catch (error) {
    console.error('Failed to start WebSocket broadcasting:', error);
  }

  try {
    scoreboardWebSocketManager.startCleanupTask();
    playbyplayWebSocketManager.startCleanupTask();
    console.log('WebSocket cleanup tasks started');
  } catch (error) {
    console.error('Failed to start WebSocket cleanup tasks:', error);
  }
}

async function stopBackgroundTasks() {
  try {
    await dataCache.stopPolling();
  } catch (e) {
    console.error('Error stopping data cache polling:', e);
  }

  try {
    await stopCleanupTask();
  } catch (e) {
    console.error('Error stopping key moments cleanup task:', e);
  }

  try {
    await scoreboardWebSocketManager.stopCleanupTask();
    await playbyplayWebSocketManager.stopCleanupTask();
  } catch (e) {
    console.error('Error stopping WebSocket cleanup tasks:', e);
  }
}

// --------------------------------------------------
// Startup & shutdown
// --------------------------------------------------

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    if (!isIISNode) {
      await startBackgroundTasks();

      server!.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } else {
      console.log('Running under IISNode - background tasks can be enabled via separate worker if desired');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    if (!isIISNode) {
      process.exit(1);
    }
  }
}

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully (SIGTERM)...');
  await stopBackgroundTasks();
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await stopBackgroundTasks();
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

startServer();

// --------------------------------------------------
// Export for IISNode
// --------------------------------------------------

export default app;