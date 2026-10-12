/**
 * Application-level error with an HTTP status code.
 * Anything thrown that is an ApiError is shown to the user as-is;
 * everything else is replaced by a friendly generic message.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { code = 'error', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message = 'Invalid request.', details) {
    return new ApiError(400, message, { code: 'bad_request', details });
  }

  static unauthorized(message = 'You need to sign in to continue.', details) {
    return new ApiError(401, message, { code: 'unauthorized', details });
  }

  static forbidden(message = 'You do not have permission to perform this action.', details) {
    return new ApiError(403, message, { code: 'forbidden', details });
  }

  static notFound(message = 'The requested resource was not found.', details) {
    return new ApiError(404, message, { code: 'not_found', details });
  }

  static conflict(message = 'That resource already exists.', details) {
    return new ApiError(409, message, { code: 'conflict', details });
  }

  static tooManyRequests(message = 'Too many requests. Please slow down.', details) {
    return new ApiError(429, message, { code: 'rate_limited', details });
  }

  /** Upstream = something outside our server (GitHub, MongoDB) failed. */
  static badGateway(message = 'An upstream service failed to respond.', details) {
    return new ApiError(502, message, { code: 'bad_gateway', details });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable.', details) {
    return new ApiError(503, message, { code: 'service_unavailable', details });
  }
}

export default ApiError;