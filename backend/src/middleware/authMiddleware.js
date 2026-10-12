import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Protects a route: requires a valid, non-expired JWT and loads the user.
 * Sets req.user = { userId, role, name, email }.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw ApiError.unauthorized('You need to sign in to perform this action.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Your session has expired. Please sign in again.', { code: 'token_expired' });
    }
    throw new ApiError(401, 'Your session is invalid. Please sign in again.', { code: 'token_invalid' });
  }

  if (!decoded?.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
    throw ApiError.unauthorized('Your session is invalid. Please sign in again.', { code: 'token_invalid' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw ApiError.unauthorized('The account linked to this session no longer exists.', { code: 'user_missing' });
  }

  req.user = {
    userId: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
  return next();
});

/**
 * Admin-only guard. Must always run AFTER `protect`.
 */
export function admin(req, _res, next) {
  if (!req.user) {
    return next(ApiError.unauthorized('You need to sign in to perform this action.'));
  }
  if (req.user.role !== 'admin') {
    return next(
      ApiError.forbidden('Administrator access is required for this resource.', { requiredRole: 'admin', yourRole: req.user.role }),
    );
  }
  return next();
}

export default { protect, admin };