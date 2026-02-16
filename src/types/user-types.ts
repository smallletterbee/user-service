export interface User {
  id: string;
  email: string;
  username: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  avatar_url: string | null;
  level: number;
  experience: number;
  stats_wins: number;
  stats_losses: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  language: string;
  theme: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithProfile {
  user: User;
  profile: UserProfile;
  preferences: UserPreferences;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  type: 'access' | 'refresh';
}

export interface ValidationResponse {
  valid: boolean;
  userId?: string;
  email?: string;
  username?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  avatar_url?: string;
  level?: number;
  experience?: number;
  stats_wins?: number;
  stats_losses?: number;
}

export interface UpdatePreferencesRequest {
  notifications_enabled?: boolean;
  language?: string;
  theme?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}
