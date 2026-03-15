const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    const tables = ['users', 'clients', 'order_services', 'order_equipments'];
    tables.forEach(table => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
            if (err) {
                console.error(`Error counting ${table}:`, err);
            } else {
                console.log(`${table}: ${row.count} rows`);
            }
        });
    });
});
