const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.all('SELECT entryDate as createdAt, id, protocol FROM order_services ORDER BY entryDate DESC LIMIT 10', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('--- RECENT ORDERS ---');
        console.log(JSON.stringify(rows, null, 2));
    }
    db.close();
});
