
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

async function resetCloud() {
    console.log("--- RESETTING CLOUD INSTANCE ---");

    // 1. Get Settings
    const settings = await new Promise((resolve) => {
        db.all("SELECT * FROM system_settings WHERE key LIKE 'whatsapp%'", [], (err, rows) => {
            if (err) resolve({});
            else {
                const s = {};
                rows.forEach(r => s[r.key] = r.value);
                resolve(s);
            }
        });
    });

    const url = settings.whatsapp_api_url;
    const token = settings.whatsapp_api_token;
    const instance = settings.whatsapp_instance_name;

    if (!url || !token || !instance) {
        console.error("❌ Config missing");
        return;
    }

    console.log(`Target: ${url} (Instance: ${instance})`);

    // 2. Try Logout
    try {
        console.log("Attempting Logout...");
        await axios.delete(`${url}/instance/logout/${instance}`, { headers: { apikey: token } });
        console.log("✅ Logout successful");
    } catch (e) {
        console.log(`   Logout failed: ${e.response ? e.response.status : e.message}`);
    }

    // 3. Try Delete (The important one for clearing corrupted state)
    try {
        console.log("Attempting DELETE...");
        await axios.delete(`${url}/instance/delete/${instance}`, { headers: { apikey: token } });
        console.log("✅ DELETE successful");
    } catch (e) {
        console.log(`   DELETE failed: ${e.response ? e.response.status : e.message}`);
        if (e.response && e.response.status === 404) {
            console.log("   (This is good - means it's gone)");
        }
    }

    db.close();
    console.log("--- RESET COMPLETE ---");
}

resetCloud();
