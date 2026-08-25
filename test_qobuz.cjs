const axios = require('axios');
const crypto = require('crypto');
const app_id = process.env.VITE_QOBUZ_APP_ID;
const secret = process.env.VITE_QOBUZ_APP_SECRET;
let token = process.env.VITE_QOBUZ_USER_TOKEN;
try {
  const tokens = JSON.parse(token);
  token = tokens[0];
} catch(e) {}

async function run() {
  try {
    const track_id = '7400';
    const format_id = 27;
    const timestamp = Math.floor(Date.now() / 1000);
    const intent = 'stream';
    const r_sig = `trackgetFileUrlformat_id${format_id}intent${intent}track_id${track_id}${timestamp}${secret}`;
    const r_sig_hashed = crypto.createHash('md5').update(r_sig).digest('hex');

    const res = await axios.get(`https://www.qobuz.com/api.json/0.2/track/getFileUrl`, {
      params: {
        track_id, format_id, intent,
        request_ts: timestamp,
        request_sig: r_sig_hashed,
        app_id: app_id,
        user_auth_token: token
      }
    });
    console.log("Success with params:", res.data.url ? "YES" : "NO");
    
    // Now with headers
    const res2 = await axios.get(`https://www.qobuz.com/api.json/0.2/track/getFileUrl`, {
      params: {
        track_id, format_id, intent,
        request_ts: timestamp,
        request_sig: r_sig_hashed
      },
      headers: {
        'x-app-id': app_id,
        'x-user-auth-token': token
      }
    });
    console.log("Success with headers:", res2.data.url ? "YES" : "NO");

  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
run();
