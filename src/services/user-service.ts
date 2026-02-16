import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as userRepository from '../repositories/user-repository';
import * as jwtService from '../services/jwt-service';
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserWithProfile,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ValidationResponse
} from '../types/user-types';
import { ServiceError, ErrorCodes } from '../types/errors';

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= PASSWORD_MIN_LENGTH;
};

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  if (!validateEmail(data.email)) {
    throw new ServiceError(
      ErrorCodes.INVALID_EMAIL,
      'Invalid email format',
      400
    );
  }

  if (!validatePassword(data.password)) {
    throw new ServiceError(
      ErrorCodes.WEAK_PASSWORD,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      400
    );
  }

  const existingUserByEmail = await userRepository.findUserByEmail(data.email);
  if (existingUserByEmail) {
    throw new ServiceError(
      ErrorCodes.EMAIL_TAKEN,
      'Email is already registered',
      409
    );
  }

  const existingUserByUsername = await userRepository.findUserByUsername(data.username);
  if (existingUserByUsername) {
    throw new ServiceError(
      ErrorCodes.USERNAME_TAKEN,
      'Username is already taken',
      409
    );
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await userRepository.createUser(data.email, passwordHash, data.username);
  await userRepository.createUserProfile(user.id);
  await userRepository.createUserPreferences(user.id);

  const token = jwtService.generateAccessToken(user.id, user.email, user.username);
  const refreshToken = jwtService.generateRefreshToken(user.id, user.email, user.username);

  return {
    user,
    token,
    refreshToken
  };
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  if (!validateEmail(data.email)) {
    throw new ServiceError(
      ErrorCodes.INVALID_EMAIL,
      'Invalid email format',
      400
    );
  }

  const userWithPassword = await userRepository.findUserWithPassword(data.email);
  if (!userWithPassword) {
    throw new ServiceError(
      ErrorCodes.INVALID_CREDENTIALS,
      'Invalid email or password',
      401
    );
  }

  const isPasswordValid = await bcrypt.compare(data.password, userWithPassword.password_hash);
  if (!isPasswordValid) {
    throw new ServiceError(
      ErrorCodes.INVALID_CREDENTIALS,
      'Invalid email or password',
      401
    );
  }

  const { password_hash, ...user } = userWithPassword;

  const token = jwtService.generateAccessToken(user.id, user.email, user.username);
  const refreshToken = jwtService.generateRefreshToken(user.id, user.email, user.username);

  return {
    user,
    token,
    refreshToken
  };
};

export const refreshAccessToken = async (refreshToken: string): Promise<{ token: string }> => {
  const validation = jwtService.validateToken(refreshToken);
  
  if (!validation.valid || !validation.userId) {
    throw new ServiceError(
      ErrorCodes.INVALID_TOKEN,
      'Invalid refresh token',
      401
    );
  }

  const user = await userRepository.findUserById(validation.userId);
  if (!user) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User not found',
      404
    );
  }

  const token = jwtService.generateAccessToken(user.id, user.email, user.username);

  return { token };
};

export const validateUserToken = (token: string): ValidationResponse => {
  return jwtService.validateToken(token);
};

export const getUserWithProfile = async (userId: string): Promise<UserWithProfile> => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User not found',
      404
    );
  }

  const profile = await userRepository.findUserProfile(userId);
  if (!profile) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User profile not found',
      404
    );
  }

  const preferences = await userRepository.findUserPreferences(userId);
  if (!preferences) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User preferences not found',
      404
    );
  }

  return {
    user,
    profile,
    preferences
  };
};

export const updateProfile = async (
  userId: string, 
  updates: UpdateProfileRequest
): Promise<UserWithProfile> => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User not found',
      404
    );
  }

  const profile = await userRepository.updateUserProfile(userId, updates);
  const preferences = await userRepository.findUserPreferences(userId);

  if (!preferences) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User preferences not found',
      404
    );
  }

  return {
    user,
    profile,
    preferences
  };
};

export const updatePreferences = async (
  userId: string, 
  updates: UpdatePreferencesRequest
): Promise<UserWithProfile> => {
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User not found',
      404
    );
  }

  const preferences = await userRepository.updateUserPreferences(userId, updates);
  const profile = await userRepository.findUserProfile(userId);

  if (!profile) {
    throw new ServiceError(
      ErrorCodes.USER_NOT_FOUND,
      'User profile not found',
      404
    );
  }

  return {
    user,
    profile,
    preferences
  };
};

export const requestPasswordReset = async (data: PasswordResetRequest): Promise<{ message: string }> => {
  const user = await userRepository.findUserByEmail(data.email);
  
  if (!user) {
    return { message: 'If the email exists, a password reset link has been sent' };
  }

  const resetToken = uuidv4();
  const tokenHash = await bcrypt.hash(resetToken, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await userRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

  console.log(`[PASSWORD RESET] Token for ${user.email}: ${resetToken}`);

  return { message: 'If the email exists, a password reset link has been sent' };
};

export const resetPassword = async (data: PasswordResetConfirm): Promise<{ message: string }> => {
  if (!validatePassword(data.newPassword)) {
    throw new ServiceError(
      ErrorCodes.WEAK_PASSWORD,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      400
    );
  }

  const tokenHash = await bcrypt.hash(data.token, SALT_ROUNDS);
  const resetToken = await userRepository.findPasswordResetToken(tokenHash);

  if (!resetToken) {
    throw new ServiceError(
      ErrorCodes.INVALID_RESET_TOKEN,
      'Invalid or expired reset token',
      400
    );
  }

  if (new Date() > resetToken.expires_at) {
    throw new ServiceError(
      ErrorCodes.RESET_TOKEN_EXPIRED,
      'Reset token has expired',
      400
    );
  }

  const newPasswordHash = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
  await userRepository.updateUserPassword(resetToken.user_id, newPasswordHash);
  await userRepository.deletePasswordResetToken(tokenHash);

  return { message: 'Password has been reset successfully' };
};

export default {
  registerUser,
  loginUser,
  refreshAccessToken,
  validateUserToken,
  getUserWithProfile,
  updateProfile,
  updatePreferences,
  requestPasswordReset,
  resetPassword
};
