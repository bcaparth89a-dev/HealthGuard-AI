import supabase from './config/supabase.js';
import fs from 'fs';

const sqlFile = 'c:/projectms/Hackathon kaggle/supabase/migrations/20260728000000_create_knowledge_base.sql';
const sql = fs.readFileSync(sqlFile, 'utf8');

const rpcNames = [
  'exec_sql', 'execute_sql', 'run_sql', 'sql', 'query', 'exec', 'execute', 'run_query'
];

async function testRpc() {
  console.log("Checking RPC sql executors using service_role client...");
  for (const name of rpcNames) {
    try {
      const { data, error } = await supabase.rpc(name, { 
        query: sql, 
        sql: sql, 
        sql_query: sql 
      });
      if (!error) {
        console.log(`✅ Success with RPC: ${name}!`);
        console.log("Result:", data);
        return;
      } else {
        console.log(`❌ RPC ${name} failed:`, error.message);
      }
    } catch (e) {
      console.log(`❌ RPC ${name} exception:`, e.message);
    }
  }
  console.log("No RPC sql executor found.");
}

testRpc();
