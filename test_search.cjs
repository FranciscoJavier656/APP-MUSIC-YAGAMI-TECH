const axios = require('axios');
async function run() {
  try {
    const res = await axios.get('http://localhost:3000/api/search?q=Beatles');
    console.log(res.data.albums?.items?.length || 0, 'search albums');
  } catch(e) {
    console.error(e.response?.data || e.message);
  }
}
run();
