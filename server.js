const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PORTAL_DIR = path.join(__dirname, 'portal');
const WEB_DIST_DIR = path.join(__dirname, 'web_dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ogg': 'audio/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function serveStaticFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + filePath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    };

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(urlObj.pathname);

  // Exact /game -> redirect to /game/
  if (pathname === '/game') {
    res.writeHead(301, { 'Location': '/game/' });
    res.end();
    return;
  }

  // Root -> Portal
  if (pathname === '/' || pathname === '/index.html') {
    return serveStaticFile(path.join(PORTAL_DIR, 'index.html'), res);
  }

  // Portal static assets
  if (pathname === '/portal.css') {
    return serveStaticFile(path.join(PORTAL_DIR, 'portal.css'), res);
  }
  if (pathname === '/portal.js') {
    return serveStaticFile(path.join(PORTAL_DIR, 'portal.js'), res);
  }

  // Game root
  if (pathname === '/game/') {
    return serveStaticFile(path.join(WEB_DIST_DIR, 'index.html'), res);
  }

  // Game files under /game/
  if (pathname.startsWith('/game/')) {
    const relGamePath = pathname.substring('/game/'.length);
    const targetFile = path.join(WEB_DIST_DIR, relGamePath);
    return serveStaticFile(targetFile, res);
  }

  // Download itch zip package
  if (pathname === '/spacescape-itch-deploy.zip' || pathname === '/download-zip') {
    const zipPath = path.join(__dirname, 'spacescape-itch-deploy.zip');
    res.setHeader('Content-Disposition', 'attachment; filename="spacescape-itch-deploy.zip"');
    return serveStaticFile(zipPath, res);
  }

  // Fallback: check if requested file exists in web_dist (e.g. flutter.js, main.dart.js, canvaskit, assets)
  const directWebDistFile = path.join(WEB_DIST_DIR, pathname.replace(/^\//, ''));
  if (fs.existsSync(directWebDistFile) && fs.statSync(directWebDistFile).isFile()) {
    return serveStaticFile(directWebDistFile, res);
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('  🚀 SPACESCAPE ARCADE SERVER ONLINE!');
  console.log('=============================================================');
  console.log(`  🕹️  Arcade Hub:      http://localhost:${PORT}`);
  console.log(`  🎮  Direct Game:     http://localhost:${PORT}/game/`);
  console.log(`  🌐  Itch.io Web:     https://versatilevedant.itch.io/spacescape`);
  console.log(`  📦  Itch.io Zip:     http://localhost:${PORT}/spacescape-itch-deploy.zip`);
  console.log('=============================================================\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use, trying ${PORT + 1}...`);
    server.listen(PORT + 1, '0.0.0.0');
  } else {
    console.error('Server error:', err);
  }
});
