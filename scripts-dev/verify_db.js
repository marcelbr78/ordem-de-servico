
const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve('./backend/database.sqlite');

console.log('Checking DB at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening DB:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite DB.');
});

db.serialize(() => {
    // List tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            console.error('Error reading tables:', err);
            return;
        }
        console.log('Tables found:', tables.map(t => t.name).join(', '));

        // Count Clients
        const clientTable = tables.find(t => t.name === 'client' || t.name === 'clients');
        if (clientTable) {
            db.get(`SELECT count(*) as count FROM ${clientTable.name}`, (err, row) => {
                if (!err) console.log(`Clients count (${clientTable.name}):`, row.count);
            });
        }

        // Count Orders
        const orderTable = tables.find(t => t.name === 'order_service' || t.name === 'orders');
        if (orderTable) {
            db.get(`SELECT count(*) as count FROM ${orderTable.name}`, (err, row) => {
                if (!err) console.log(`Orders count (${orderTable.name}):`, row.count);
            });
        }
    });
});

// Close after a delay to allow queries to finish
setTimeout(() => {
    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Database connection closed.');
    });
}, 1000);
