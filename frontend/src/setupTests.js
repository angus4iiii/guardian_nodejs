// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const BACKEND_URL = 'http://localhost:3001';

function testBackendWithRandomSerials() {
  for (let i = 0; i < 10; i++) {
    const crankSerial = 'TEST' + Math.floor(Math.random() * 1000000);
    fetch(`${BACKEND_URL}/api/podoqc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crankSerial })
    })
      .then(res => res.json())
      .then(data => {
        console.log(`crankSerial: ${crankSerial}`, data);
      })
      .catch(err => {
        console.error(`crankSerial: ${crankSerial}`, err);
      });
  }
}

// Export the function for debugging
module.exports = { testBackendWithRandomSerials };
