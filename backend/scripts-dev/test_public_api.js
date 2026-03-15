const axios = require('axios');
const id = '00a5a264-4a5b-4d96-b9ae-b09dde69c391';

async function test() {
    try {
        const res = await axios.get(`http://localhost:3001/orders/public/${id}`);
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
