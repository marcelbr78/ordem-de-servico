const axios = require('axios');

async function testMonitor() {
    try {
        console.log('Testing GET http://127.0.0.1:3001/orders/public/monitor...');
        const res = await axios.get('http://127.0.0.1:3001/orders/public/monitor');
        console.log('Success! Data count:', res.data.length);
        if (res.data.length > 0) {
            console.log('Sample item:', JSON.stringify(res.data[0], null, 2));
        }
    } catch (err) {
        if (err.response) {
            console.error('API Error:', err.response.status, err.response.data);
        } else if (err.request) {
            console.error('No response received! Is the server running?');
            console.error(err.message);
        } else {
            console.error('Error:', err.message);
        }
    }
}

testMonitor();
