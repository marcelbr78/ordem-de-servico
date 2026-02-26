const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('c:/Users/loja/Documents/Ordem de serviço/backend/database.sqlite');

db.all("SELECT id, protocol, status, deletedAt FROM order_services LIMIT 5", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Orders sample:', JSON.stringify(rows, null, 2));
    }
    db.close();
});
