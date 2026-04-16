#!/usr/bin/env node

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST = process.env.TRADE_CRM_STATIC_HOST || '127.0.0.1';
const PORT = Number.parseInt(
  process.env.TRADE_CRM_STATIC_PORT || '4175',
  10,
);
const BUILD_DIR = path.join(
  __dirname,
  '..',
  'packages',
  'twenty-front',
  'build',
);
const INDEX_FILE = path.join(BUILD_DIR, 'index.html');

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendResponse(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendNotFound(res) {
  sendResponse(
    res,
    404,
    { 'content-type': 'text/plain; charset=utf-8' },
    'Not found',
  );
}

function resolveFilePath(requestUrl) {
  const url = new URL(requestUrl, `http://${HOST}:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const candidatePath = path.normalize(path.join(BUILD_DIR, requestedPath));

  if (!candidatePath.startsWith(BUILD_DIR)) {
    return null;
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  return INDEX_FILE;
}

if (!fs.existsSync(BUILD_DIR) || !fs.existsSync(INDEX_FILE)) {
  console.error(
    `Missing built frontend assets in ${BUILD_DIR}. Run the front-end build first.`,
  );
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendNotFound(res);
    return;
  }

  const filePath = resolveFilePath(req.url);

  if (!filePath || !fs.existsSync(filePath)) {
    sendNotFound(res);
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType =
    MIME_TYPES[extension] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);

    sendResponse(
      res,
      200,
      {
        'cache-control': 'no-cache',
        'content-type': contentType,
      },
      content,
    );
  } catch (error) {
    sendResponse(
      res,
      500,
      { 'content-type': 'text/plain; charset=utf-8' },
      error instanceof Error ? error.message : 'Unknown server error',
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(
    `Trade CRM static preview listening on http://${HOST}:${PORT} from ${BUILD_DIR}`,
  );
});
