const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
    db.all("SELECT id, protocol, status, priority FROM order_services WHERE status NOT IN ('entregue', 'cancelada')", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Active Order Count:', rows.length);
        console.log('Statuses found:', [...new Set(rows.map(r => r.status))]);
        console.log('Priorities found:', [...new Set(rows.map(r => r.priority))]);
        console.log('Sample rows:', rows.slice(0, 5));
        db.close();
    });
});
