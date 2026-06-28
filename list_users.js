import { Client } from 'pg';

async function setup() {
  const connectionString = "postgresql://postgres:Auto@@&&CABD@db.bxvfcvszhvrbglvmuwxy.supabase.co:5432/postgres";

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const res = await client.query('SELECT email FROM auth.users');
    console.log("Users:", res.rows);

  } catch (err) {
    console.error("Database connection/execution error:", err);
  } finally {
    await client.end();
  }
}

setup();
