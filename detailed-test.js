const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'ws-test2.log');
const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

fs.writeFileSync(logFile, '[Test Start ' + new Date().toISOString() + ']\n');
log('Node version: ' + process.version);
log('Connecting to ws://127.0.0.1:8000/api/v1/ws');

const ws = new WebSocket('ws://127.0.0.1:8000/api/v1/ws');
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
  log(`✅ MESSAGE (${data.length} bytes): ${data.toString().slice(0, 150)}`);
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  log(`❌ ERROR event: code=${err.code}, message="${err.message}"`);
  log(`   Full error: ${JSON.stringify(err, null, 2)}`);
  clearTimeout(timeout);
  process.exit(1);
});

ws.on('close', (code, reason) => {
  log(`Connection closed: code=${code}, reason="${reason}"`);
});

// Log all events
ws.on('unexpected-response', (req, res) => {
  log(`unexpected-response: status=${res.statusCode}, reason="${res.statusMessage}"`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => log(`Response body: ${data}`));
});
