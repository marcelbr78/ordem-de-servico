const http = require('http');

// Step 1: Login to get token
const loginBody = JSON.stringify({ email: 'admin', password: 'admin123' });

const loginOptions = {
    hostname: 'localhost',
    port: 3005,
    path: '/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
};

const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const token = json.access_token;
        if (!token) { console.log('Login failed:', data); return; }
        console.log('Token obtained. Testing POST /bank-accounts...');

        // Step 2: POST bank account
        const payload = JSON.stringify({
            name: 'Conta Teste',
            bank: 'Bradesco',
            bankCode: '237',
            type: 'corrente',
            agency: '',
            agencyDigit: '',
            account: '',
            accountDigit: '',
            pixKey: '',
            pixKeyType: '',
            holderName: '',
            holderDocument: '',
            initialBalance: 0,
            isActive: true,
            description: '',
            color: '#6366f1'
        });

        const postOptions = {
            hostname: 'localhost',
            port: 3005,
            path: '/bank-accounts',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${token}`
            }
        };

        const postReq = http.request(postOptions, (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
                console.log(`Status: ${res2.statusCode}`);
                console.log('Response:', data2);
            });
        });
        postReq.on('error', e => console.error('POST error:', e));
        postReq.write(payload);
        postReq.end();
    });
});
loginReq.on('error', e => console.error('Login error:', e));
loginReq.write(loginBody);
loginReq.end();
