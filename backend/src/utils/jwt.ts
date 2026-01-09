import jwt from 'jsonwebtoken';
<<<<<<< Updated upstream
import { AuthUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): AuthUser => {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
=======

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
>>>>>>> Stashed changes
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

<<<<<<< Updated upstream
export const generatePasswordResetToken = (): string => {
  return jwt.sign({ purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
=======
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
>>>>>>> Stashed changes
};
