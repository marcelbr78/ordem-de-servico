const s = require('sqlite3');
const d = new s.Database('database.sqlite');
d.all("PRAGMA table_info(order_parts)", (e, r) => {
    if (e) { console.error(e); return; }
    console.log('order_parts schema:');
    r.forEach(col => console.log(`  ${col.name} (${col.type}) notnull=${col.notnull} dflt=${col.dflt_value}`));
    d.close();
});
