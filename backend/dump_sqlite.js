const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'lib_interno.sqlite');
const db = new sqlite3.Database(dbPath);

const tables = ['clients', 'order_services', 'suppliers_registry'];
const data = {};

let pending = tables.length;

tables.forEach(table => {
    db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
        if (err) {
            console.error(`Error reading ${table}:`, err.message);
            data[table] = [];
        } else {
            data[table] = rows;
            console.log(`Read ${rows.length} rows from ${table}`);
        }
        pending--;
        if (pending === 0) {
            fs.writeFileSync(path.join(__dirname, 'dump_data.json'), JSON.stringify(data, null, 2));
            console.log('Done! Data saved to dump_data.json');
            db.close();
        }
    });
});
