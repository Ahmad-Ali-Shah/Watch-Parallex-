/**
 * server.js
 * ---------------------------------------------------------------------------
 * Minimal Express server for the WatchAssembly site.
 *
 * In production it serves the static, built frontend from `frontend/dist`
 * (run `npm run build` first — see README.md).
 *
 * Usage:
 *   npm run setup   -> installs root + frontend deps
 *   npm run build   -> builds the React app (Vite) into frontend/dist
 *   npm start        -> serves frontend/dist on http://localhost:3000
 *
 * For local development with hot reload, use `npm run dev:frontend`
 * instead (Vite's own dev server), which is faster while iterating on
 * the animation. Point that at this server only for production/staging.
 * ---------------------------------------------------------------------------
 */

const path = require('path');
const express = require('express');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'frontend', 'dist');

// Gzip everything — this matters a lot here since we're serving ~49 JPEG
// frames plus the JS bundle; compression + long cache headers below keep
// the scroll-scrub experience snappy after the first load.
app.use(compression());

// Long-lived caching for the immutable, hashed Vite build assets.
app.use(
  '/assets',
  express.static(path.join(DIST_DIR, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// The frame sequence images change rarely once shipped, but give them a
// generous (not infinite) cache so you can swap frames without users being
// stuck on stale ones for a year.
app.use(
  '/images',
  express.static(path.join(DIST_DIR, 'images'), {
    maxAge: '7d',
  })
);

// Everything else in dist (index.html, favicon, etc.)
app.use(express.static(DIST_DIR));

// SPA fallback — send index.html for any non-file route.
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WatchAssembly server running → http://localhost:${PORT}`);
});
