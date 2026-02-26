const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/loja/Documents/Ordem de serviço/backend/database.sqlite');

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Tables:', tables.map(t => t.name).join(', '));

    db.get("SELECT COUNT(*) as count FROM order_services", (err, row) => {
        if (err) {
            console.error('Error counting orders:', err.message);
        } else {
            console.log('Order count:', row.count);
        }

        db.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
            if (err) {
                console.error('Error counting clients:', err.message);
            } else {
                console.log('Client count:', row.count);
            }
            db.close();
        });
    });
});
