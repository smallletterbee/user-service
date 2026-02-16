import { Router, Request, Response } from 'express';
import * as userService from '../services/user-service';
import { authenticate, AuthRequest } from '../middleware/auth-middleware';
import { ServiceError, ErrorCodes } from '../types/errors';
import {
  RegisterRequest,
  LoginRequest,
  RefreshRequest,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  PasswordResetRequest,
  PasswordResetConfirm
} from '../types/user-types';

const router = Router();

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const data: RegisterRequest = req.body;
    const result = await userService.registerUser(data);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const data: LoginRequest = req.body;
    const result = await userService.loginUser(data);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Login error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const data: RefreshRequest = req.body;
    const result = await userService.refreshAccessToken(data.refreshToken);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.post('/auth/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({
        error: ErrorCodes.INVALID_TOKEN,
        message: 'Token is required'
      });
      return;
    }

    const result = userService.validateUserToken(token);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Token validation error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.get('/users/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (req.user?.userId !== userId) {
      res.status(403).json({
        error: ErrorCodes.UNAUTHORIZED,
        message: 'Access denied'
      });
      return;
    }

    const result = await userService.getUserWithProfile(userId);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Get user error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.put('/users/:userId/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (req.user?.userId !== userId) {
      res.status(403).json({
        error: ErrorCodes.UNAUTHORIZED,
        message: 'Access denied'
      });
      return;
    }

    const updates: UpdateProfileRequest = req.body;
    const result = await userService.updateProfile(userId, updates);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.put('/users/:userId/preferences', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (req.user?.userId !== userId) {
      res.status(403).json({
        error: ErrorCodes.UNAUTHORIZED,
        message: 'Access denied'
      });
      return;
    }

    const updates: UpdatePreferencesRequest = req.body;
    const result = await userService.updatePreferences(userId, updates);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Update preferences error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.post('/auth/request-password-reset', async (req: Request, res: Response) => {
  try {
    const data: PasswordResetRequest = req.body;
    const result = await userService.requestPasswordReset(data);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Password reset request error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const data: PasswordResetConfirm = req.body;
    const result = await userService.resetPassword(data);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
    } else {
      console.error('Password reset error:', error);
      res.status(500).json({
        error: ErrorCodes.INTERNAL_ERROR,
        message: 'Internal server error'
      });
    }
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
