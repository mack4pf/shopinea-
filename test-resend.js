const https = require('https');

const API_KEY = 're_Gq9gHhn7_B4rMGK1ojkgeseU3Ra2UUJ8d'; // From your .env

const data = JSON.stringify({
  from: 'noreply@shoplinea.shop',
  to: 'mackiyeritufu@gmail.com', // Your email from the chat
  subject: 'Test API Send',
  html: '<strong>Test email from direct HTTPS request.</strong>',
});

const options = {
  hostname: 'api.resend.com',
  port: 443,
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e);
});

req.write(data);
req.end();
