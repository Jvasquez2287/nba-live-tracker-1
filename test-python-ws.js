/**
 * Direct test to Python backend WebSocket
 */

const WebSocket = require('ws');

console.log('\n🧪 Testing Direct Connection to Python Backend WebSocket\n');

const pythonWsUrl = 'ws://nba-v1.m-api.net:8000/api/v1/scoreboard/ws';
console.log(`📡 Connecting to: ${pythonWsUrl}`);

const ws = new WebSocket(pythonWsUrl);

ws.on('open', () => {
  console.log('✅ Connected to Python backend WebSocket');
  console.log('ℹ️ Waiting for message from Python backend...');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('✅ Received message from Python backend:');
    console.log(JSON.stringify(message, null, 2).slice(0, 500) + '...');
    ws.close();
    process.exit(0);
  } catch (e) {
    console.log('ℹ️ Received raw data:', data.toString().slice(0, 200));
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Error code:', error.code);
  process.exit(1);
});

ws.on('close', () => {
  console.log('ℹ️ Connection closed');
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('⏱️ Connection timeout (no response from Python backend)');
  ws.close();
  process.exit(1);
}, 5000);
