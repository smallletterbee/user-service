import { Pool, PoolClient } from 'pg';
import { ServiceError, ErrorCodes } from '../types/errors';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'arcane_user-service',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export const query = async (text: string, params?: unknown[]): Promise<unknown> => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw new ServiceError(
      ErrorCodes.DATABASE_ERROR,
      'Database operation failed',
      500
    );
  }
};

export const getClient = async (): Promise<PoolClient> => {
  try {
    return await pool.connect();
  } catch (error) {
    console.error('Database connection error:', error);
    throw new ServiceError(
      ErrorCodes.DATABASE_ERROR,
      'Failed to connect to database',
      500
    );
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
};

export default { query, getClient, closePool };
