const bcrypt = require('bcrypt');

async function test() {
    // Test 1: Hash and compare
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash('admin1234', salt);
    console.log('Hash:', hash);
    const match = await bcrypt.compare('admin1234', hash);
    console.log('Match:', match);

    // Test 2: Read the actual DB
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('./database.sqlite');
    db.get("SELECT email, password FROM users WHERE email = 'admin'", (err, row) => {
        if (err) { console.error('DB Error:', err); return; }
        if (!row) { console.log('Admin user NOT found in DB!'); return; }
        console.log('DB email:', row.email);
        console.log('DB password hash:', row.password);
        console.log('Hash length:', row.password.length);

        bcrypt.compare('admin1234', row.password).then(result => {
            console.log('DB password matches admin1234?', result);
            db.close();
        });
    });
}
test();
