const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_vip3_user:A148fkZy4OI1bcZS57SBurAHTlP9kFIl@dpg-d6rgudnpm1nc73bjucq0-a.oregon-postgres.render.com/os4u_db_vip3';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function dropIndex() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    const res = await client.query('DROP INDEX IF EXISTS "IDX_8ec1a80842519855fbe77a14b5";');
    console.log('Query result:', res.command);
  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

dropIndex();
