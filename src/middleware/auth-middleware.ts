import { Request, Response, NextFunction } from 'express';
import { validateToken } from '../services/jwt-service';
import { ServiceError, ErrorCodes } from '../types/errors';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ServiceError(
        ErrorCodes.UNAUTHORIZED,
        'Missing or invalid authorization header',
        401
      );
    }

    const token = authHeader.substring(7);
    const validation = validateToken(token);

    if (!validation.valid) {
      throw new ServiceError(
        ErrorCodes.UNAUTHORIZED,
        'Invalid token',
        401
      );
    }

    req.user = {
      userId: validation.userId!,
      email: validation.email!,
      username: validation.username!
    };

    next();
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
};

export default { authenticate };
