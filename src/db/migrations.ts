import { query } from './database';

export const runMigrations = async (): Promise<void> => {
  console.log('Running database migrations...');

  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✓ Users table created');

    // Create user_profiles table
    await query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        avatar_url VARCHAR(500),
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        stats_wins INTEGER DEFAULT 0,
        stats_losses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ User profiles table created');

    // Create user_preferences table
    await query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notifications_enabled BOOLEAN DEFAULT true,
        language VARCHAR(10) DEFAULT 'en',
        theme VARCHAR(20) DEFAULT 'light',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ User preferences table created');

    // Create password_reset_tokens table
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Password reset tokens table created');

    // Create indexes for performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)
    `);
    console.log('✓ Indexes created');

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
