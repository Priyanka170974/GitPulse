import express from 'express';
import cors from 'cors';
import { config, validateEnv } from './config/env.js';
import { configureDns } from './config/dns.js';
import { connectDB, disconnectDB, isDbConnected } from './config/db.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Normally done by src/bootstrap.js before this file is even imported.
// Calling it here (idempotent) keeps `node src/server.js` working too.
configureDns();

validateEnv();

const app = express();

/* ----------------------------- middleware --------------------------- */

/**
 * Origins allowed to call this API.
 *  • CLIENT_URL may list several origins, separated by commas.
 *  • In DEVELOPMENT only, any loopback origin is also accepted
 *    (http://localhost:<port>, http://127.0.0.1:<port>, http://[::1]:<port>).
 *    Vite does not always start on 5173 — when that port is taken it falls
 *    back to 5174, 5175, 5176 … and that number changes whenever another
 *    program on the machine grabs a port. A browser cannot forge a loopback
 *    Origin header, so this rule stays safe for local development.
 *  • In PRODUCTION none of this applies — only CLIENT_URL is honoured and
 *    every other origin is rejected. There is no wildcard fallback.
 */
const allowedOrigins = new Set(
  config.clientUrl
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),
);

const LOCAL_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
const allowLoopbackOrigin = !config.isProduction;

const allowAllOrigins = allowedOrigins.has('*');

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/curl (no Origin header) and any configured client URL.
      if (!origin || allowAllOrigins || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      // Development only: any locally served frontend.
      if (allowLoopbackOrigin && LOCAL_ORIGIN_RE.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/** Lightweight security headers (no extra dependency needed). */
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.removeHeader('X-Powered-By');
  next();
});

/** Request logger. */
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - startedAt;
    const tint = res.statusCode >= 500 ? 31 : res.statusCode >= 400 ? 33 : 32;
    console.log(
      `\x1b[90m${new Date().toISOString().slice(11, 19)}\x1b[0m \x1b[36m${req.method.padEnd(6)}\x1b[0m ${req.originalUrl} → \x1b[${tint}m${res.statusCode}\x1b[0m (${ms}ms)`,
    );
  });
  next();
});

/* ------------------------------- routes ----------------------------- */

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'GitPulse API is running. Health check: GET /api/health',
  });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

/* ---------------------------- lifecycle ----------------------------- */

const server = app.listen(config.port, async () => {
  console.log('\n\x1b[35m✦ GitPulse API\x1b[0m');
  console.log(`  → http://localhost:${config.port}/api/health`);
  console.log(`  → environment: ${config.env}`);
  console.log(
  `  → allowed origins: ${allowAllOrigins ? '* (CLIENT_URL=*)' : [...allowedOrigins].join(', ')}` +
    `${allowLoopbackOrigin ? ' + any local port (development only)' : ''}`,
);
  console.log(`  → GitHub token: ${config.githubToken ? 'configured' : 'not configured (60 requests/hour limit)'}`);

  try {
    await connectDB();
    console.log(`\x1b[32m✔ GitPulse is ready on port ${config.port}\x1b[0m\n`);
  } catch (error) {
    console.error('\n\x1b[41m✖ Server stopped: the database connection failed.\x1b[0m');
    console.error(`   ${error.message}\n`);
    server.close(() => process.exit(1));
  }
});

/* ----------------------------- shutdown ----------------------------- */

const shutdown = async (signal) => {
  console.log(`\n\x1b[33m⚠ ${signal} received — shutting down GitPulse gracefully…\x1b[0m`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31m[GitPulse] Unhandled promise rejection:\x1b[0m', reason);
});

export { app, server, isDbConnected };
export default app;