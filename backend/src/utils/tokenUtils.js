import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/** JWT payload deliberately contains only userId + role — never the password. */
export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

export function signTokenPair(user) {
  return { token: signToken(user), expiresIn: config.jwtExpiresIn };
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export default { signToken, signTokenPair, verifyToken };