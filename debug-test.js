// Debug entry point that runs the new tests from frontend/setupTests.js
// This script runs the example tests (the array in frontend/src/exampleCrankMaps.js)

console.log('Starting debug test runner');
console.log('Make sure the backend server is running on http://localhost:3001');

// Import the test helpers we added to the frontend test utilities
const { runExampleTestByIndex } = require('./frontend/src/setupTests');

async function runAllExamples() {
  try {
    const summary = [];
    for (let i = 0; i < 4; i++) {
      // small delay between runs to avoid overwhelming the backend
      await new Promise(r => setTimeout(r, 250));
      console.log(`\n=== Running example ${i + 1} ===`);
      try {
        const results = await runExampleTestByIndex(i);
        console.log(`Example ${i + 1} results:`, results);
        summary.push({ index: i, pass: !!results.pass, details: results });
      } catch (err) {
        console.error(`Example ${i + 1} thrown:`, err);
        summary.push({ index: i, pass: false, error: String(err) });
      }
    }

    console.log('\nAll example tests complete. Summary:');
    console.log(JSON.stringify(summary, null, 2));

    const anyFailed = summary.some(s => !s.pass);
    if (anyFailed) {
      console.error('One or more example tests failed — exiting with code 1');
      process.exitCode = 1;
    } else {
      console.log('All example tests passed.');
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Error running example tests:', err);
  }
}

// Give environment a second to settle then run
setTimeout(() => {
  runAllExamples();
}, 1000);