const { Client } = require('pg');

async function testPostgres() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
        database: 'assistencia_db',
    });

    try {
        await client.connect();
        console.log('✅ Connected to Postgres!');

        const res = await client.query("SELECT name FROM sqlite_master WHERE type='table'");
        // Wait, it's postgres, not sqlite.
        const resTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', resTables.rows.map(r => r.table_name).join(', '));

        if (resTables.rows.some(r => r.table_name === 'clients')) {
            const resClients = await client.query("SELECT COUNT(*) FROM clients");
            console.log('Clients count:', resClients.rows[0].count);
        }

    } catch (err) {
        console.error('❌ Failed to connect to Postgres:', err.message);
    } finally {
        await client.end();
    }
}

testPostgres();
