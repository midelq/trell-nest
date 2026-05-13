const postgres = require('postgres');
require('dotenv').config();

async function checkDb() {
  console.log('Connecting to:', process.env.DATABASE_URL);
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const result = await sql`SELECT 1 as connected`;
    console.log('Successfully connected to DB');
    console.log('Result:', result);
    await sql.end();
  } catch (err) {
    console.error('FULL ERROR:', err);
  }
}

checkDb();
