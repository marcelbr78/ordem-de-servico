const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_vip3_user:A148fkZy4OI1bcZS57SBurAHTlP9kFIl@dpg-d6rgudnpm1nc73bjucq0-a.oregon-postgres.render.com/os4u_db_vip3';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function listTables() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Error listing tables:', err.stack);
  } finally {
    await client.end();
  }
}

listTables();
