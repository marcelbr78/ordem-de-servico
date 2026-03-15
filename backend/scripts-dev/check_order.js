const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');
const id = '39a2006d-6073-48f9-b53b-ff114d413711';

db.serialize(() => {
    db.all("SELECT id, protocol FROM order_services WHERE id = ? OR protocol = ?", [id, id], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Results:', rows);
        db.close();
    });
});
