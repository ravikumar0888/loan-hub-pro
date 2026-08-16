import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthUser } from '../types';

const INSECURE_DEFAULT_SECRET = 'default-secret-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === INSECURE_DEFAULT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable must be set to a strong, unique value before starting the server. ' +
    'Refusing to start with an unset or default secret, as this allows tokens to be forged for any user.'
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): AuthUser => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
