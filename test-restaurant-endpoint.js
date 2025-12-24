const axios = require('axios');

const testRestaurantEndpoint = async () => {
  try {
    const response = await axios.post('http://localhost:3000/restaurants', {
      name: 'Test Restaurant',
      description: 'A test restaurant',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country'
    }, {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im93bmVyNEBnbWFpbC5jb20iLCJzdWIiOjUsInJvbGUiOiJSZXN0YXVyYW50IE93bmVyIiwiaWF0IjoxNzY1ODc0ODk2LCJleHAiOjE3NjU4NzU3OTZ9.Ih4kjEdYUMhf1Kwr0VFcS-O99RPnZvg31oCmuZ7QYgI',
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.log('Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
};

testRestaurantEndpoint();