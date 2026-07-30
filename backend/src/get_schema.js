import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const url = `${process.env.SUPABASE_URL}/rest/v1/`;

async function getSchema() {
  try {
    const res = await axios.get(url, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });
    console.log("Paths found in schema:");
    console.log(Object.keys(res.data.paths));
    
    console.log("\nDefinitions found in schema:");
    if (res.data.definitions) {
      console.log(Object.keys(res.data.definitions));
      console.log("\nDetails of predictions definition:");
      console.log(JSON.stringify(res.data.definitions.predictions, null, 2));
    }
  } catch (error) {
    console.error("Error fetching schema:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

getSchema();
