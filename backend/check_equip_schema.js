const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    console.log('Checking order_equipments columns...');
    db.all("PRAGMA table_info(order_equipments)", (err, columns) => {
        if (err) {
            console.error('Error:', err);
            return;
        }
        columns.forEach(c => console.log(` - ${c.name} (${c.type})`));
    });
});
