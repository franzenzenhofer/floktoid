#!/usr/bin/env node

/**
 * Embed static assets into the worker for self-contained deployment
 */

import fs from 'fs';
import path from 'path';

const distDir = 'dist';
const workerFile = 'src/worker.js';

// Read built assets
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
const cssFile = fs.readdirSync(path.join(distDir, 'assets')).find(f => f.endsWith('.css'));
const jsFile = fs.readdirSync(path.join(distDir, 'assets')).find(f => f.endsWith('.js'));

const css = fs.readFileSync(path.join(distDir, 'assets', cssFile), 'utf-8');
const js = fs.readFileSync(path.join(distDir, 'assets', jsFile), 'utf-8');

// Read the base worker
let workerContent = fs.readFileSync(workerFile, 'utf-8');

// Generate embedded content - use JSON.stringify to properly escape
const embeddedAssets = `
// Embedded static assets
const STATIC_ASSETS = {
  'index.html': ${JSON.stringify(indexHtml)},
  'assets/${cssFile}': ${JSON.stringify(css)},
  'assets/${jsFile}': ${JSON.stringify(js)},
};

function serveStaticAsset(pathname) {
  const asset = STATIC_ASSETS[pathname] || STATIC_ASSETS[pathname.substring(1)];
  if (!asset) return null;
  
  const mimeType = pathname.endsWith('.css') ? 'text/css' :
                   pathname.endsWith('.js') ? 'application/javascript' :
                   'text/html';
                   
  return new Response(asset, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': pathname.endsWith('.html') ? 'public, max-age=0' : 'public, max-age=31536000',
    },
  });
}
`;

// Replace the old HTML template
workerContent = workerContent.replace(
  /import { html } from '\.\/templates\.js';/,
  embeddedAssets
);

// Update the root route to serve embedded assets
workerContent = workerContent.replace(
  /router\.get\('\/'\, async \(request, env\) => \{[\s\S]*?\}\);/,
  `router.get('/', async (request, env) => {
  return serveStaticAsset('index.html') || new Response('Not Found', { status: 404 });
});`
);

// Add asset serving route
const assetRoute = `
// Serve static assets
router.get('/assets/*', async (request) => {
  const url = new URL(request.url);
  return serveStaticAsset(url.pathname) || new Response('Not Found', { status: 404 });
});

`;

// Insert before the API routes
workerContent = workerContent.replace(
  /\/\/ API: Generate new puzzle/,
  assetRoute + '// API: Generate new puzzle'
);

// Remove the old template import and HTML variable
workerContent = workerContent.replace(/const html = [\s\S]*?';/, '');
workerContent = workerContent.replace(/return new Response\(html, \{[\s\S]*?\}\);/, 'return serveStaticAsset("index.html");');

// Write the updated worker
fs.writeFileSync('src/worker-embedded.js', workerContent);
console.log('✅ Assets embedded into worker-embedded.js');
console.log(`   CSS: ${cssFile} (${(css.length / 1024).toFixed(1)}KB)`);
console.log(`   JS: ${jsFile} (${(js.length / 1024).toFixed(1)}KB)`);
console.log(`   Total: ${((indexHtml.length + css.length + js.length) / 1024).toFixed(1)}KB`);