const s = require('sqlite3');
const d = new s.Database('database.sqlite');
d.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (e, r) => {
    if (e) { console.error(e); return; }
    console.log('Tables:', r.map(t => t.name).join(', '));
    d.close();
});
