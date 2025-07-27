const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const SCORE_FILE = path.join(__dirname, 'scores.json');

function loadScores() {
  try {
    const data = fs.readFileSync(SCORE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveScores(scores) {
  fs.writeFileSync(SCORE_FILE, JSON.stringify(scores, null, 2));
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

function requestHandler(req, res) {
  const parsed = url.parse(req.url, true);
  if (req.method === 'GET' && parsed.pathname === '/scores') {
    const scores = loadScores().sort((a, b) => b.score - a.score).slice(0, 10);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scores));
    return;
  }

  if (req.method === 'POST' && parsed.pathname === '/submit') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        let scores = loadScores();
        scores.push({ name: data.name || 'Anonymous', score: data.score });
        saveScores(scores);
        scores = scores.sort((a, b) => b.score - a.score).slice(0, 10);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(scores));
      } catch (e) {
        res.writeHead(400);
        res.end('Invalid data');
      }
    });
    return;
  }

  // serve static files
  let filePath = '.' + parsed.pathname;
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };
  const contentType = mimeTypes[ext] || 'text/plain';
  sendFile(res, filePath, contentType);
}

const PORT = process.env.PORT || 3000;
http.createServer(requestHandler).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
