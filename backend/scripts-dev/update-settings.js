
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const updates = [
    { key: 'whatsapp_api_url', value: 'https://evolution-d2ml.onrender.com' },
    { key: 'whatsapp_api_token', value: 'inventeUmaSenhaForte123' }
];

db.serialize(() => {
    updates.forEach(update => {
        db.run("UPDATE system_settings SET value = ? WHERE key = ?", [update.value, update.key], function (err) {
            if (err) {
                console.error(`Error updating ${update.key}:`, err);
            } else {
                console.log(`Updated ${update.key}, changes: ${this.changes}`);
            }
        });
    });
});

db.close();
