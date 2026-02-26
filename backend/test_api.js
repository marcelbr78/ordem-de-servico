const axios = require('axios');

async function testApi() {
    try {
        const response = await axios.get('http://localhost:3001/orders/public/monitor');
        console.log('Success! Monitor data count:', response.data.length);
        if (response.data.length > 0) {
            console.log('First order protocol:', response.data[0].protocol);
        }
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testApi();
