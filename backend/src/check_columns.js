import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testInsert() {
  console.log("Inserting empty object...");
  const { data, error } = await supabase.from('predictions').insert([{}]).select();
  console.log("Insert result:", { data, error });
  if (data && data.length > 0) {
    // delete it
    await supabase.from('predictions').delete().eq('id', data[0].id);
    console.log("Cleaned up");
  }
}

testInsert();
