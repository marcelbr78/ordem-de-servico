const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/loja/Documents/Ordem de serviço/backend/database.sqlite');

db.serialize(() => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='clients'", (err, row) => {
        if (!row) {
            console.log("No 'clients' table found.");
            return;
        }
        db.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
            console.log(`Clients count: ${row ? row.count : 'error'}`);
        });
    });

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='order_services'", (err, row) => {
        if (!row) {
            console.log("No 'order_services' table found.");
            return;
        }
        db.get("SELECT COUNT(*) as count FROM order_services", (err, row) => {
            console.log(`Orders count: ${row ? row.count : 'error'}`);
        });
    });

    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='suppliers_registry'", (err, row) => {
        if (!row) {
            console.log("No 'suppliers_registry' table found.");
            return;
        }
        db.get("SELECT COUNT(*) as count FROM suppliers_registry", (err, row) => {
            console.log(`Suppliers count: ${row ? row.count : 'error'}`);
        });
    });
});
db.close();
