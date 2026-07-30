import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const rpcNames = [
  'exec_sql', 'execute_sql', 'run_sql', 'sql', 'query', 'exec', 'execute', 'run_query'
];

async function discoverRpc() {
  for (const name of rpcNames) {
    try {
      console.log(`Trying RPC: ${name}...`);
      const { data, error } = await supabase.rpc(name, { query: 'SELECT 1;', sql: 'SELECT 1;', sql_query: 'SELECT 1;' });
      console.log(`RPC ${name} result:`, { data, error });
    } catch (e) {
      console.log(`RPC ${name} exception:`, e.message);
    }
  }
}

discoverRpc();
