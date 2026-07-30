import { createClient } from '@supabase/supabase-js';
import config from './index.js';
import logger from '../utils/logger.js';

let supabase = null;

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = serviceKey || config.supabaseAnonKey;

if (config.supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(config.supabaseUrl, supabaseKey);
    if (serviceKey) {
      logger.info('✅ Backend Supabase initialized using Service Role Key.');
    } else {
      logger.info('⚠️ Backend Supabase initialized using Anon Key (Service Role Key missing).');
    }
  } catch (error) {
    logger.error('Failed to initialize Supabase Client on backend:', error);
  }
} else {
  logger.warn('Supabase URL or Anon Key is missing. Backend will operate in mock-fallback mode.');
}

export default supabase;