const axios = require('axios');

async function testReports() {
  try {
    const res = await axios.get('http://localhost:5000/api/reports?startDate=2023-01-01&endDate=2026-12-31');
    console.log("Success! Data:", res.data);
  } catch (error) {
    if (error.response) {
      console.error("HTTP Error Status:", error.response.status);
      console.error("Error Data:", error.response.data);
    } else {
      console.error("Network Error:", error.message, error.stack);
    }
  }
}

testReports();
