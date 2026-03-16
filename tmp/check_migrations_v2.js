const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_2xjy_user:7EX059o3JeiTaadE2y8t30wza9KMkkEq@dpg-d6rimqn5gffc73833st0-a.oregon-postgres.render.com/os4u_db_2xjy';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkMigrations() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    const res = await client.query('SELECT * FROM migrations');
    if (res.rows.length === 0) {
      console.log('No migrations found in the table.');
    } else {
      console.log('Migrations executed:');
      console.table(res.rows);
    }
  } catch (err) {
    if (err.message.includes('relation "migrations" does not exist')) {
        console.log('Table "migrations" does not exist yet.');
    } else {
        console.error('Error checking migrations:', err.message);
    }
  } finally {
    await client.end();
  }
}

checkMigrations();
