import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrations';
import userRoutes from './api/user-routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());

app.use('/api', userRoutes);

const startServer = async () => {
  try {
    console.log('Starting User Service...');
    
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log(`User Service is running on port ${PORT}`);
      console.log(`CORS enabled for origin: ${CORS_ORIGIN}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
