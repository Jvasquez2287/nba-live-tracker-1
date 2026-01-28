const WebSocket = require('ws');

console.log('\n🔧 WebSocket IPv6 Test\n');

const ws = new WebSocket('ws://[::1]:8000/api/v1/ws');

ws.on('open', () => {
  console.log('✅ Connected!');
});

ws.on('message', (data) => {
  console.log('📨 Message received:');
  try {
    const parsed = JSON.parse(data);
    console.log(JSON.stringify(parsed, null, 2).substring(0, 500));
  } catch (e) {
    console.log(data.toString().substring(0, 200));
  }
  ws.close();
});

ws.on('error', (error) => {
  console.log('❌ Error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n✋ Closed');
  process.exit(0);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 5000);
