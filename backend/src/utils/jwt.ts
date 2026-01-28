import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
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
  return jwt.sign({ purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
};
