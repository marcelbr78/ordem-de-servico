const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://os4u-backend.onrender.com';
const SQL_PATH = path.join(__dirname, 'migrate_data_infosend.sql');

async function run() {
    try {
        console.log('Logging in as Master...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'master@os4u.com.br',
            password: 'master123'
        });

        const token = loginRes.data.access_token;
        console.log('Login successful.');

        const sql = fs.readFileSync(SQL_PATH, 'utf-8');
        console.log(`Executing migration (${sql.length} bytes)...`);

        const migrateRes = await axios.post(`${API_URL}/admin/tenants/migration/execute`, 
            { sql },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Migration finished!');
        console.log(`Total statements: ${migrateRes.data.total}`);
        
        const errors = migrateRes.data.results.filter(r => r.status === 'error');
        if (errors.length > 0) {
            console.log(`Finished with ${errors.length} errors.`);
            fs.writeFileSync('migration_errors.json', JSON.stringify(errors, null, 2));
            console.log('Errors saved to migration_errors.json');
        } else {
            console.log('All statements executed successfully!');
        }

    } catch (err) {
        console.error('Migration failed:', err.response ? err.response.data : err.message);
    }
}

run();
