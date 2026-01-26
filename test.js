const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    message: 'IISNode test successful',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    iisnode: !!process.env.IISNODE_VERSION,
    cwd: process.cwd()
  }));
});

const port = process.env.PORT || 8080;

// Only listen if not under IISNode
if (!process.env.IISNODE_VERSION) {
  server.listen(port, () => {
    console.log(`Test server running on port ${port}`);
  });
}

module.exports = server;