const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_2xjy_user:7EX059o3JeiTaadE2y8t30wza9KMkkEq@dpg-d6rimqn5gffc73833st0-a.oregon-postgres.render.com/os4u_db_2xjy?sslmode=no-verify';

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
      ORDER BY table_name;
    `);
    
    if (res.rows.length === 0) {
      console.log('No relations found.');
    } else {
      console.log('List of relations:');
      console.table(res.rows);
    }
  } catch (err) {
    console.error('Error listing tables:', err.message);
  } finally {
    try {
        await client.end();
    } catch(e) {}
  }
}

listTables();
