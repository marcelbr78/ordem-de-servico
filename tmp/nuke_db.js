const { Client } = require('pg');

const connectionString = 'postgresql://os4u_db_2xjy_user:7EX059o3JeiTaadE2y8t30wza9KMkkEq@dpg-d6rimqn5gffc73833st0-a.oregon-postgres.render.com/os4u_db_2xjy';

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const nukeSql = `
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
    END LOOP;
END $$;

DROP INDEX IF EXISTS "IDX_8ec1a80842519855fbe77a14b5";
`;

const verifySql = `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`;

async function main() {
  try {
    await client.connect();
    console.log('Connected to the database.');
    
    console.log('Nuking public schema...');
    await client.query(nukeSql);
    console.log('Nuke complete.');

    console.log('Verifying tables...');
    const res = await client.query(verifySql);
    if (res.rows.length === 0) {
      console.log('Verification: No tables found in public schema. Success!');
    } else {
      console.log('Verification failed! Remaining tables:', res.rows.map(r => r.tablename).join(', '));
    }
  } catch (err) {
    console.error('Database error:', err.stack);
  } finally {
    await client.end();
  }
}

main();
