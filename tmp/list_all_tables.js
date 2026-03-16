const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_vip3_user:A148fkZy4OI1bcZS57SBurAHTlP9kFIl@dpg-d6rgudnpm1nc73bjucq0-a.oregon-postgres.render.com/os4u_db_vip3';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function listAllTables() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    const res = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `);
    console.log('Tables:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error listing tables:', err.stack);
  } finally {
    await client.end();
  }
}

listAllTables();
