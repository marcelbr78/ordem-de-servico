const s = require('sqlite3');
const d = new s.Database('database.sqlite');
d.all("PRAGMA table_info(users)", (e, r) => {
    if (e) { console.error(e); return; }
    console.log('Columns:', r.map(c => c.name).join(', '));
    d.all("SELECT id, email, name FROM users LIMIT 5", (e2, rows) => {
        if (e2) { console.error(e2); return; }
        rows.forEach(u => console.log(JSON.stringify(u)));
        d.close();
    });
});
