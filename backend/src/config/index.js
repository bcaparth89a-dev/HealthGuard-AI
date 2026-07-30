import dotenv from 'dotenv';

dotenv.config();
console.log("===== ENV DEBUG =====");
console.log("SUPABASE_URL =", process.env.SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY =", process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("All env keys:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
console.log("=====================");
export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  geminiApiKey: process.env.GEMINI_API_KEY,
  mlApiUrl: process.env.ML_API_URL || 'http://localhost:8000',
};