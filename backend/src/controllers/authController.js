import { User } from '../models/User.js';
import { Repository } from '../models/Repository.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { signTokenPair } from '../utils/tokenUtils.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * POST /api/auth/register
 * Hashes the password with bcrypt (12 rounds) before it ever touches MongoDB.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !String(name).trim()) {
    throw ApiError.badRequest('Please tell us your name.', { field: 'name' });
  }
  if (String(name).trim().length < 2) {
    throw ApiError.badRequest('Your name must be at least 2 characters long.', { field: 'name' });
  }
  if (!email || !String(email).trim()) {
    throw ApiError.badRequest('Please enter your email address.', { field: 'email' });
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    throw ApiError.badRequest('That email address does not look valid.', { field: 'email' });
  }
  if (!password) {
    throw ApiError.badRequest('Please choose a password.', { field: 'password' });
  }
  if (String(password).length < 8) {
    throw ApiError.badRequest('Your password must be at least 8 characters long.', { field: 'password' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  if (await User.isEmailTaken(normalizedEmail)) {
    throw ApiError.conflict('An account with that email address already exists. Try signing in instead.', {
      field: 'email',
    });
  }

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password,
    role: 'user', // role can never be self-assigned
  });

  const { token, expiresIn } = signTokenPair(user);

  return sendSuccess(res, {
    data: { user: user.toJSON(), token, expiresIn },
    message: `Welcome to GitPulse, ${user.name.split(' ')[0]}! Your account is ready.`,
    status: 201,
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw ApiError.badRequest('Please enter both your email address and password.', { fields: ['email', 'password'] });
  }

  // password is select:false in the schema, so ask for it explicitly
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

  // Same generic message for "no such user" and "wrong password" — no user enumeration.
  if (!user || !(await user.matchPassword(String(password)))) {
    throw ApiError.unauthorized('Incorrect email or password. Please try again.');
  }

  const { token, expiresIn } = signTokenPair(user);

  return sendSuccess(res, {
    data: { user: user.toJSON(), token, expiresIn },
    message: `Welcome back, ${user.name.split(' ')[0]}!`,
  });
});

/**
 * GET /api/auth/me  (protected)
 * Returns the profile + a couple of counters for the profile page.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) throw ApiError.notFound('This account no longer exists.');

  const [repositoryCount, analysisCount] = await Promise.all([
    Repository.countDocuments({ userId: user._id }),
    AnalysisHistory.countDocuments({ userId: user._id }),
  ]);

  const tracked = await Repository.find({ userId: user._id })
    .select('fullName stars activity.pulseScore')
    .sort({ lastAnalyzedAt: -1 })
    .limit(5)
    .lean();

  return sendSuccess(res, {
    data: {
      user: user.toJSON(),
      stats: {
        repositories: repositoryCount,
        analyses: analysisCount,
        memberSince: user.createdAt,
        averagePulse: tracked.length
          ? Math.round(tracked.reduce((sum, r) => sum + (r.activity?.pulseScore || 0), 0) / tracked.length)
          : 0,
      },
      recent: tracked.map((r) => ({
        fullName: r.fullName,
        stars: r.stars,
        pulseScore: r.activity?.pulseScore || 0,
      })),
    },
  });
});

/**
 * PUT /api/auth/profile  (protected)
 * Only the display name can be changed — never the role, never the email.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    throw ApiError.badRequest('Your name cannot be empty.', { field: 'name' });
  }
  if (String(name).trim().length < 2) {
    throw ApiError.badRequest('Your name must be at least 2 characters long.', { field: 'name' });
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { $set: { name: String(name).trim() } },
    { new: true, runValidators: true },
  );

  if (!user) throw ApiError.notFound('This account no longer exists.');

  return sendSuccess(res, { data: { user: user.toJSON() }, message: 'Profile updated.' });
});

/**
 * POST /api/auth/logout  (protected)
 * JWT is stateless — the client drops the token. The endpoint exists so the
 * app has an explicit, auditable logout step and future token-blacklisting.
 */
export const logout = asyncHandler(async (_req, res) => {
  return sendSuccess(res, {
    data: { loggedOut: true },
    message: 'You have been signed out of GitPulse.',
  });
});

export default { register, login, getMe, updateProfile, logout };