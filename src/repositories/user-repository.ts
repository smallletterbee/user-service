import { query } from '../db/database';
import { 
  User, 
  UserProfile, 
  UserPreferences,
  UpdateProfileRequest,
  UpdatePreferencesRequest,
  PasswordResetToken
} from '../types/user-types';
import { ServiceError, ErrorCodes } from '../types/errors';

interface QueryResult {
  rows: unknown[];
  rowCount: number;
}

export const createUser = async (
  email: string, 
  passwordHash: string, 
  username: string
): Promise<User> => {
  const result = await query(
    `INSERT INTO users (email, password_hash, username) 
     VALUES ($1, $2, $3) 
     RETURNING id, email, username, created_at, updated_at, is_active`,
    [email, passwordHash, username]
  ) as QueryResult;
  
  return result.rows[0] as User;
};

export const createUserProfile = async (userId: string): Promise<UserProfile> => {
  const result = await query(
    `INSERT INTO user_profiles (user_id) 
     VALUES ($1) 
     RETURNING id, user_id, avatar_url, level, experience, stats_wins, stats_losses, created_at, updated_at`,
    [userId]
  ) as QueryResult;
  
  return result.rows[0] as UserProfile;
};

export const createUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const result = await query(
    `INSERT INTO user_preferences (user_id) 
     VALUES ($1) 
     RETURNING id, user_id, notifications_enabled, language, theme, created_at, updated_at`,
    [userId]
  ) as QueryResult;
  
  return result.rows[0] as UserPreferences;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(
    `SELECT id, email, username, created_at, updated_at, is_active 
     FROM users 
     WHERE email = $1`,
    [email]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as User) : null;
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const result = await query(
    `SELECT id, email, username, created_at, updated_at, is_active 
     FROM users 
     WHERE username = $1`,
    [username]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as User) : null;
};

export const findUserById = async (userId: string): Promise<User | null> => {
  const result = await query(
    `SELECT id, email, username, created_at, updated_at, is_active 
     FROM users 
     WHERE id = $1`,
    [userId]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as User) : null;
};

export const findUserWithPassword = async (email: string): Promise<(User & { password_hash: string }) | null> => {
  const result = await query(
    `SELECT id, email, username, password_hash, created_at, updated_at, is_active 
     FROM users 
     WHERE email = $1`,
    [email]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as User & { password_hash: string }) : null;
};

export const findUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const result = await query(
    `SELECT id, user_id, avatar_url, level, experience, stats_wins, stats_losses, created_at, updated_at 
     FROM user_profiles 
     WHERE user_id = $1`,
    [userId]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as UserProfile) : null;
};

export const findUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const result = await query(
    `SELECT id, user_id, notifications_enabled, language, theme, created_at, updated_at 
     FROM user_preferences 
     WHERE user_id = $1`,
    [userId]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as UserPreferences) : null;
};

export const updateUserProfile = async (
  userId: string, 
  updates: UpdateProfileRequest
): Promise<UserProfile> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramCounter = 1;

  if (updates.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramCounter++}`);
    values.push(updates.avatar_url);
  }
  if (updates.level !== undefined) {
    fields.push(`level = $${paramCounter++}`);
    values.push(updates.level);
  }
  if (updates.experience !== undefined) {
    fields.push(`experience = $${paramCounter++}`);
    values.push(updates.experience);
  }
  if (updates.stats_wins !== undefined) {
    fields.push(`stats_wins = $${paramCounter++}`);
    values.push(updates.stats_wins);
  }
  if (updates.stats_losses !== undefined) {
    fields.push(`stats_losses = $${paramCounter++}`);
    values.push(updates.stats_losses);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await query(
    `UPDATE user_profiles 
     SET ${fields.join(', ')} 
     WHERE user_id = $${paramCounter} 
     RETURNING id, user_id, avatar_url, level, experience, stats_wins, stats_losses, created_at, updated_at`,
    values
  ) as QueryResult;

  if (result.rows.length === 0) {
    throw new ServiceError(ErrorCodes.USER_NOT_FOUND, 'User profile not found', 404);
  }

  return result.rows[0] as UserProfile;
};

export const updateUserPreferences = async (
  userId: string, 
  updates: UpdatePreferencesRequest
): Promise<UserPreferences> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramCounter = 1;

  if (updates.notifications_enabled !== undefined) {
    fields.push(`notifications_enabled = $${paramCounter++}`);
    values.push(updates.notifications_enabled);
  }
  if (updates.language !== undefined) {
    fields.push(`language = $${paramCounter++}`);
    values.push(updates.language);
  }
  if (updates.theme !== undefined) {
    fields.push(`theme = $${paramCounter++}`);
    values.push(updates.theme);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(userId);

  const result = await query(
    `UPDATE user_preferences 
     SET ${fields.join(', ')} 
     WHERE user_id = $${paramCounter} 
     RETURNING id, user_id, notifications_enabled, language, theme, created_at, updated_at`,
    values
  ) as QueryResult;

  if (result.rows.length === 0) {
    throw new ServiceError(ErrorCodes.USER_NOT_FOUND, 'User preferences not found', 404);
  }

  return result.rows[0] as UserPreferences;
};

export const createPasswordResetToken = async (
  userId: string, 
  tokenHash: string, 
  expiresAt: Date
): Promise<PasswordResetToken> => {
  const result = await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) 
     VALUES ($1, $2, $3) 
     RETURNING id, user_id, token_hash, expires_at, created_at`,
    [userId, tokenHash, expiresAt]
  ) as QueryResult;
  
  return result.rows[0] as PasswordResetToken;
};

export const findPasswordResetToken = async (tokenHash: string): Promise<PasswordResetToken | null> => {
  const result = await query(
    `SELECT id, user_id, token_hash, expires_at, created_at 
     FROM password_reset_tokens 
     WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [tokenHash]
  ) as QueryResult;
  
  return result.rows.length > 0 ? (result.rows[0] as PasswordResetToken) : null;
};

export const deletePasswordResetToken = async (tokenHash: string): Promise<void> => {
  await query(
    `DELETE FROM password_reset_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
};

export const updateUserPassword = async (userId: string, passwordHash: string): Promise<void> => {
  await query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [passwordHash, userId]
  );
};

export default {
  createUser,
  createUserProfile,
  createUserPreferences,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  findUserWithPassword,
  findUserProfile,
  findUserPreferences,
  updateUserProfile,
  updateUserPreferences,
  createPasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
  updateUserPassword
};
