// Debug entry point for testBackendWithRandomSerials
// Run this file to test the backend with random serial numbers

// Use Node.js built-in http module for HTTP requests (compatible with older Node versions)
const http = require('http');

const BACKEND_URL = 'http://localhost:3001';

// Create a Node.js compatible version of the test function
function testBackendWithRandomSerials() {
  console.log('Testing backend with random serials...');
  
  for (let i = 0; i < 10; i++) {
    const crankSerial = 'TEST' + Math.floor(Math.random() * 1000000);
    
    // Create HTTP request options
    const postData = JSON.stringify({ crankSerial });
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/podoqc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    // Make the HTTP request
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`crankSerial: ${crankSerial}`, jsonData);
        } catch (err) {
          console.error(`crankSerial: ${crankSerial} - Parse error:`, err.message);
          console.error(`Raw response: ${data}`);
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`crankSerial: ${crankSerial} - Request error:`, err.message);
    });
    
    // Write data to request body
    req.write(postData);
    req.end();
  }
}

console.log('Starting testBackendWithRandomSerials...');
console.log('Make sure the backend server is running on http://localhost:3001');

// Add a small delay to ensure the backend is ready
setTimeout(() => {
  try {
    testBackendWithRandomSerials();
    console.log('Test function called successfully. Check the console for API responses.');
  } catch (error) {
    console.error('Error calling testBackendWithRandomSerials:', error);
  }
}, 1000);

// Keep the process alive to see all responses
setTimeout(() => {
  console.log('Debug session complete. Press Ctrl+C to exit or set breakpoints to debug further.');
}, 5000);