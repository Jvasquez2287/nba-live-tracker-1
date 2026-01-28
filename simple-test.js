const WebSocket = require('ws');
const fs = require('fs');

const logFile = 'ws-test.log';
const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

fs.writeFileSync(logFile, '[Test Start]\n');
log('Connecting to ws://localhost:8000/api/v1/ws');

const ws = new WebSocket('ws://localhost:8000/api/v1/ws');
let timeout = setTimeout(() => {
  log('TIMEOUT: No response after 3 seconds');
  ws.close();
  process.exit(1);
}, 3000);

ws.on('open', () => {
  log('✅ OPEN event fired');
  clearTimeout(timeout);
});

ws.on('message', (data) => {
  log(`✅ MESSAGE: ${data.toString().slice(0, 100)}`);
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  log(`❌ ERROR: ${err.message}`);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', () => {
  log('Connection closed');
});
