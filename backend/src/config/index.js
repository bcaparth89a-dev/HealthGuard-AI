import dotenv from 'dotenv';
import path from 'path';

// Load environmental variables
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
};

export default config;
