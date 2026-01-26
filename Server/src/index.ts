import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { WebSocketServer } from 'ws';
import http from 'http';

// Debug logging for IISNode
console.log('NBA API Server starting...');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('IISNode version:', process.env.IISNODE_VERSION || 'Not running under IISNode');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Also try loading from current working directory (for IISNode compatibility)
dotenv.config();
// Additional fallback for IISNode
if (process.env.IISNODE_VERSION) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}
// Additional fallback for IISNode
if (process.env.IISNODE_VERSION) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

// Import services
import { dataCache } from './services/dataCache';
import { scoreboardWebSocketManager, playbyplayWebSocketManager } from './services/websocketManager';
import { startCleanupTask, stopCleanupTask } from './services/keyMoments';

// Import routes
import scoreboardRoutes from './routes/scoreboard';
import scheduleRoutes from './routes/schedule';
import standingsRoutes from './routes/standings';
import playerRoutes from './routes/players';
import teamRoutes from './routes/teams';
import searchRoutes from './routes/search';
import predictionsRoutes from './routes/predictions';
import leagueRoutes from './routes/league';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const frontendUrl = process.env.FRONTEND_URL || '*';
let allowedOrigins: string[];

if (frontendUrl === '*') {
  allowedOrigins = ['*'];
} else {
  allowedOrigins = [frontendUrl];
  if (!frontendUrl.includes('localhost') && !frontendUrl.includes('127.0.0.1')) {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    );
  }
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check endpoint - available immediately
app.get('/', (req, res) => {
  res.json({
    message: 'NBA Live API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    iisnode: !!process.env.IISNODE_VERSION
  });
});

// Config check endpoint
app.get('/api/v1/config/check', (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  res.json({
    groq_configured: !!groqKey,
    groq_key_length: groqKey ? groqKey.length : 0,
    environment: process.env.NODE_ENV || 'development',
    iisnode: !!process.env.IISNODE_VERSION
  });
});

// API routes
app.use('/api/v1', scoreboardRoutes);
app.use('/api/v1', scheduleRoutes);
app.use('/api/v1', standingsRoutes);
app.use('/api/v1', playerRoutes);
app.use('/api/v1', teamRoutes);
app.use('/api/v1', searchRoutes);
app.use('/api/v1', predictionsRoutes);
app.use('/api/v1', leagueRoutes);

// WebSocket handling
wss.on('connection', (ws, req) => {
  const url = req.url;

  if (url === '/api/v1/ws') {
    scoreboardWebSocketManager.handleConnection(ws);
  } else if (url?.startsWith('/api/v1/playbyplay/ws/')) {
    const gameId = url.split('/').pop();
    if (gameId) {
      playbyplayWebSocketManager.handleConnection(ws, gameId);
    }
  }
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');

  await dataCache.stopPolling();
  await stopCleanupTask();
  await scoreboardWebSocketManager.stopCleanupTask();
  await playbyplayWebSocketManager.stopCleanupTask();

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    console.log('Starting NBA data polling and WebSocket broadcasting...');

    // For IISNode debugging, don't start background services initially
    if (!process.env.IISNODE_VERSION) {
      // Only start background services when not under IISNode
      try {
        dataCache.startPolling();
        console.log('Data cache polling started');
      } catch (error) {
        console.error('Failed to start data cache polling:', error);
      }

      try {
        startCleanupTask();
        console.log('Cleanup task started');
      } catch (error) {
        console.error('Failed to start cleanup task:', error);
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
    } else {
      console.log('Running under IISNode - skipping background services for initial testing');
    }

    // Only listen if not running under IISNode
    if (!process.env.IISNODE_VERSION) {
      server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    } else {
      console.log('Server configured for IISNode');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    // Don't exit in IISNode environment - let IIS handle the error
    if (!process.env.IISNODE_VERSION) {
      process.exit(1);
    }
  }
}

startServer();

// Export the server for IISNode
export default server;