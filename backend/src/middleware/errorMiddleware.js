import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { isDbConnected } from '../config/db.js';

/** 404 handler for unmatched routes. */
export function notFound(req, _res, next) {
  next(
    new ApiError(404, `Route ${req.method} ${req.originalUrl} does not exist on the GitPulse API.`, {
      code: 'route_not_found',
    }),
  );
}

/**
 * Centralised error handler.
 * Users never see stack traces or driver internals — only friendly text.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the GitPulse server.';
  let code = err.code || 'server_error';
  let details = err.details || null;

  /* ------------------------- Mongoose errors ------------------------ */
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
    code = 'validation_error';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `"${err.value}" is not a valid ${err.kind === 'ObjectId' ? 'id' : 'value'}.`;
    code = 'invalid_id';
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'duplicate_key';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message =
      field === 'email'
        ? 'An account with that email address already exists. Try signing in instead.'
        : `That ${field} is already in use.`;
    details = err.keyValue;
  }

  /* --------------------------- JWT errors --------------------------- */
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Your session is invalid. Please sign in again.';
    code = 'token_invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please sign in again.';
    code = 'token_expired';
  }

  /* ----------------------- Database connectivity -------------------- */
  else if (!isDbConnected() && !(err instanceof ApiError)) {
    statusCode = 503;
    message =
      'GitPulse cannot reach its database right now. Check the MongoDB Atlas connection string in backend/.env.';
    code = 'database_unavailable';
  }

  /* --------------------------- Fall back ---------------------------- */
  else if (statusCode >= 500 && !(err instanceof ApiError)) {
    message = config.isProduction
      ? 'Something went wrong on the GitPulse server. Please try again.'
      : err.message || message;
  }

  if (statusCode >= 500) {
    console.error('\x1b[31m[GitPulse] Unhandled error:\x1b[0m', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
    ...(!config.isProduction && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

export default { notFound, errorHandler };