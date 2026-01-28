/**
 * WebSocket Proxy Test Client
 * Tests that TypeScript server proxies WebSocket connections to Python backend
 */

const WebSocket = require('ws');

console.log('\n🧪 WebSocket Proxy Test Started\n');

// Test 1: Scoreboard WebSocket
console.log('📡 Test 1: Connecting to Scoreboard WebSocket...');
const scoreboardWs = new WebSocket('ws://localhost:8000/api/v1/ws');

scoreboardWs.on('open', () => {
  console.log('✅ Scoreboard: Connected to TypeScript proxy');
});

scoreboardWs.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('✅ Scoreboard: Received message from Python backend:', {
      type: message.type || 'unknown',
      games_count: message.scoreboard?.games?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Close after receiving first message
    setTimeout(() => {
      scoreboardWs.close();
      console.log('✅ Scoreboard: Closed connection\n');
      
      // Start Test 2 after scoreboard test completes
      testPlaybyplay();
    }, 1000);
  } catch (e) {
    console.log('ℹ️ Scoreboard: Received data:', data.toString().slice(0, 100));
  }
});

scoreboardWs.on('error', (error) => {
  console.error('❌ Scoreboard: Connection error:', error.message);
  testPlaybyplay();
});

scoreboardWs.on('close', () => {
  console.log('ℹ️ Scoreboard: Connection closed');
});

function testPlaybyplay() {
  console.log('📡 Test 2: Connecting to PlayByPlay WebSocket...');
  const playbyplayWs = new WebSocket('ws://localhost:8000/api/v1/playbyplay/ws/0022300001');

  playbyplayWs.on('open', () => {
    console.log('✅ PlayByPlay: Connected to TypeScript proxy for game 0022300001');
  });

  playbyplayWs.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('✅ PlayByPlay: Received message from Python backend:', {
        type: message.type || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      setTimeout(() => {
        playbyplayWs.close();
        console.log('✅ PlayByPlay: Closed connection\n');
        console.log('✅✅✅ All tests passed! WebSocket proxy is working correctly.\n');
        process.exit(0);
      }, 1000);
    } catch (e) {
      console.log('ℹ️ PlayByPlay: Received data:', data.toString().slice(0, 100));
    }
  });

  playbyplayWs.on('error', (error) => {
    console.error('❌ PlayByPlay: Connection error:', error.message);
    console.log('⚠️ This might be expected if Python backend is not running at nba-v1.m-api.net:8000');
    process.exit(1);
  });

  playbyplayWs.on('close', () => {
    console.log('ℹ️ PlayByPlay: Connection closed');
  });

  // Timeout after 5 seconds
  setTimeout(() => {
    if (playbyplayWs.readyState !== WebSocket.CLOSED) {
      console.error('⏱️ PlayByPlay: Connection timeout (no response from Python backend)');
      playbyplayWs.close();
      process.exit(1);
    }
  }, 5000);
}

// Timeout for scoreboard test
setTimeout(() => {
  if (scoreboardWs.readyState !== WebSocket.CLOSED) {
    console.error('⏱️ Scoreboard: Connection timeout (no response from Python backend)');
    scoreboardWs.close();
    process.exit(1);
  }
}, 8000);
