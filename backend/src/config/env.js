import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Load backend/.env regardless of where the process was started from.
dotenv.config({ path: path.resolve(currentDir, '../../.env') });
dotenv.config({ path: path.resolve(currentDir, '../../../.env') });

const env = process.env.NODE_ENV || 'development';

export const config = {
  env,
  isProduction: env === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: (process.env.MONGO_URI || '').trim(),
  jwtSecret: (process.env.JWT_SECRET || '').trim(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d').trim(),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').trim(),
  githubToken: (process.env.GITHUB_TOKEN || '').trim(),
  // Optional override — useful for GitHub Enterprise Server (https://ghe.example.com/api/v3)
  // or for automated testing against a local mock server.
  githubApiUrl: (process.env.GITHUB_API_URL || '').trim(),
  // Optional DNS resolvers used for MongoDB Atlas SRV lookups.
  // Leave empty for the built-in fallback, or set "system" to use the OS resolver.
  // See src/config/dns.js.
  dnsServers: (process.env.DNS_SERVERS || '').trim(),
};

/**
 * Validates required environment variables.
 * The server refuses to boot with a fake "connected" state when the
 * configuration is broken — this is intentional (see README, section "Environment").
 */
export function validateEnv() {
  const problems = [];

  if (!config.mongoUri) {
    problems.push('MONGO_URI is missing. Copy backend/.env.example to backend/.env and paste your MongoDB Atlas connection string.');
  } else if (!config.mongoUri.startsWith('mongodb')) {
    problems.push('MONGO_URI does not look like a MongoDB connection string (it must start with "mongodb://" or "mongodb+srv://").');
  }

  if (!config.jwtSecret) {
    problems.push('JWT_SECRET is missing. Copy backend/.env.example to backend/.env and set a long random secret.');
  } else if (config.jwtSecret.length < 16) {
    problems.push('JWT_SECRET is too short. Use at least 16 characters.');
  }

  if (!Number.isFinite(config.port) || config.port < 1 || config.port > 65535) {
    problems.push('PORT must be a number between 1 and 65535.');
  }

  if (problems.length > 0) {
    console.error('\n\x1b[41m✖ Invalid environment configuration\x1b[0m');
    problems.forEach((p) => console.error(`   • ${p}`));
    console.error('\n   Backend .env file expected at: backend/.env\n');
    throw new Error('Invalid environment configuration');
  }
}

/** Never leaks secrets in logs. */
export function describeConfig() {
  return {
    environment: config.env,
    port: config.port,
    clientUrl: config.clientUrl,
    mongo: config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'),
    githubTokenConfigured: Boolean(config.githubToken),
    dnsServersConfigured: Boolean(config.dnsServers),
  };
}

export default config;