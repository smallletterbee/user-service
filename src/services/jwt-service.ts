import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload, ValidationResponse } from '../types/user-types';
import { ServiceError, ErrorCodes } from '../types/errors';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRY: string = process.env.JWT_EXPIRY || '24h';
const JWT_REFRESH_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || '7d';

export const generateAccessToken = (userId: string, email: string, username: string): string => {
  const payload = {
    userId,
    email,
    username,
    type: 'access'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY } as SignOptions);
};

export const generateRefreshToken = (userId: string, email: string, username: string): string => {
  const payload = {
    userId,
    email,
    username,
    type: 'refresh'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY } as SignOptions);
};

export const validateToken = (token: string): ValidationResponse => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    return {
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ServiceError(
        ErrorCodes.EXPIRED_TOKEN,
        'Token has expired',
        401
      );
    }
    
    throw new ServiceError(
      ErrorCodes.INVALID_TOKEN,
      'Invalid token',
      401
    );
  }
};

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export default {
  generateAccessToken,
  generateRefreshToken,
  validateToken,
  decodeToken
};
