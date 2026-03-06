
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("SELECT * FROM plans", [], (err, rows) => {
    if (err) {
        console.error('ERROR:', err.message);
        return;
    }
    console.log('PLANS IN DB:', JSON.stringify(rows, null, 2));
    db.close();
});
