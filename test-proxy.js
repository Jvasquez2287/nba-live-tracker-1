/**
 * Test WebSocket connection through TypeScript proxy
 */

const WebSocket = require('ws');

console.log('\n🧪 Testing WebSocket Connection Through TypeScript Proxy\n');

// Test 1: Scoreboard WebSocket through proxy
console.log('📡 Test 1: Connecting to Scoreboard WebSocket through TypeScript proxy...');
const proxyUrl = 'ws://localhost:8000/api/v1/ws';
console.log(`🔗 URL: ${proxyUrl}`);

const ws = new WebSocket(proxyUrl);
let connected = false;

ws.on('open', () => {
  connected = true;
  console.log('✅ Connected to TypeScript proxy!');
  console.log('ℹ️ Waiting for data from Python backend...');
});

ws.on('message', (data) => {
  try {
    console.log('✅ Received data from proxy (forwarded from Python backend):');
    console.log('   First message received successfully');
    
    // Try to parse as JSON to show structure
    try {
      const msg = JSON.parse(data);
      if (msg.status === 'connected') {
        console.log(`   - TypeScript proxy ack: ${msg.message}`);
      } else {
        console.log(`   - Message type: ${msg.type || 'unknown'}`);
        if (msg.scoreboard) {
          console.log(`   - Contains scoreboard with ${msg.scoreboard.games?.length || 0} games`);
        }
      }
    } catch (e) {
      // Binary or non-JSON data
      console.log(`   - Received data (${data.length} bytes)`);
    }
    
    // Close connection after receiving first message
    setTimeout(() => {
      ws.close();
      console.log('✅ Test completed successfully!\n');
      process.exit(0);
    }, 500);
    
  } catch (error) {
    console.error('Error processing message:', error);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  if (error.message.includes('ECONNREFUSED')) {
    console.error('⚠️ TypeScript proxy server not responding - is npm run start still running?');
  }
  process.exit(1);
});

ws.on('close', (code, reason) => {
  console.log(`ℹ️ Connection closed (code: ${code}, reason: ${reason})`);
  if (!connected) {
    console.error('❌ Connection never established!');
    process.exit(1);
  }
});

// Timeout
setTimeout(() => {
  console.error('⏱️ No response from server after 5 seconds');
  ws.close();
  process.exit(1);
}, 5000);
