const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.all("PRAGMA table_info(clients)", (err, cols) => {
    if (err) { console.log('Error:', err.message); return; }
    console.log('=== CLIENTS TABLE SCHEMA ===');
    cols.forEach(c => console.log(`  ${c.name} | ${c.notnull ? 'NOT NULL' : 'nullable'} | default: ${c.dflt_value || 'none'}`));

    db.all("SELECT id, nome, cpfCnpj FROM clients LIMIT 5", (err2, rows) => {
        console.log('\n=== SAMPLE DATA ===');
        if (err2) { console.log('Error:', err2.message); }
        else { rows.forEach(r => console.log(JSON.stringify(r))); }

        db.all("SELECT COUNT(*) as total FROM clients WHERE nome IS NULL", (err3, res) => {
            console.log('\n=== NULL NOME COUNT ===');
            if (err3) console.log('Error:', err3.message);
            else console.log('Rows with NULL nome:', res[0].total);
            db.close();
        });
    });
});
