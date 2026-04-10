const axios = require('axios');

async function testDownload() {
  try {
    const res = await axios.get('http://localhost:5000/api/sales/download');
    console.log("Success! Status:", res.status);
  } catch (error) {
    if (error.response) {
      console.error("HTTP Error Status:", error.response.status);
      console.error("Error Data:", error.response.data);
    } else {
      console.error("Network Error:", error.message);
    }
  }
}

testDownload();
