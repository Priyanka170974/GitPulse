import mongoose from 'mongoose';
import { config } from './env.js';

let connection = null;

/**
 * Connects the app to MongoDB Atlas.
 * Rejects (throws) when the cluster is unreachable so the HTTP server
 * never pretends the database is available.
 */
export async function connectDB() {
  if (!config.mongoUri) {
    throw new Error('MONGO_URI is not configured. Add it to backend/.env before starting the server.');
  }

  mongoose.set('strictQuery', true);

  try {
    connection = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 10000, // fail fast instead of hanging
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    });

    const { host, name } = connection.connection;
    console.log(`\x1b[32m✔ MongoDB Atlas connected\x1b[0m → db "${name}" @ ${host}`);

    connection.connection.on('error', (err) => {
      console.error('\x1b[31m✖ MongoDB connection error:\x1b[0m', err.message);
    });
    connection.connection.on('disconnected', () => {
      console.warn('\x1b[33m⚠ MongoDB disconnected — retrying on next operation…\x1b[0m');
    });

    return connection;
  } catch (error) {
    console.error('\n\x1b[41m✖ Could not connect to MongoDB Atlas\x1b[0m');
    console.error(`   Reason: ${error.message}`);
    console.error('   Checklist:');
    console.error('   1. backend/.env exists and contains a valid MONGO_URI');
    console.error('   2. The Atlas cluster is deployed (not paused)');
    console.error('   3. Your IP is added in Atlas → Network Access');
    console.error('   4. The database user + password in the URI are correct\n');
    throw error;
  }
}

export async function disconnectDB() {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    console.log('\x1b[33m⚠ MongoDB connection closed\x1b[0m');
  }
}

/** Returns true only when the driver actually holds a live connection. */
export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export default connectDB;