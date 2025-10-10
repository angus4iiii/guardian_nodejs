// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
// When run by Jest this provides extra matchers. Guard it so requiring
// this file from Node (debug scripts) doesn't crash on an ES import.
try {
  require('@testing-library/jest-dom');
} catch (err) {
  // Not in a Jest/browser environment; ignore.
}

const BACKEND_URL = 'http://localhost:3001';
const { exampleCrankMaps } = require('./exampleCrankMaps');
const { runSequence } = require('./runSequence');
// fallback single example for older helpers
const exampleCrankMap = exampleCrankMaps[0];

// Polyfill fetch for older Node versions (Node < 18). If node-fetch is not
// installed, we print a helpful message — CI uses Node 18 so this is mainly
// for local debugging on older machines.
if (typeof fetch === 'undefined') {
  try {
    const nf = require('node-fetch');
    // node-fetch v2 exports a function, v3 is ESM (may expose default)
    global.fetch = (typeof nf === 'function') ? nf : (nf && nf.default) ? nf.default : undefined;
    if (typeof fetch === 'function') {
      console.log('Using node-fetch polyfill for global.fetch');
    }
  } catch (err) {
    console.warn('global.fetch is not available. For local debug runs please either run with Node >= 18 or install node-fetch@2:');
    console.warn('  cd frontend && npm install node-fetch@2');
  }
}

// Example crankSerial map structure with expected numeric per-test results
async function performRun(crankSerial) {
  const { numericResults, crankSide } = await runSequence(crankSerial);
  // return numeric array only for backward compatibility
  return numericResults;
}

/**
 * Run one of the example crank maps by index (or id) and log test number & description.
 * Resolves to the newResults array.
 */
async function runExampleTestByIndex(indexOrId) {
  // determine the case
  let item = null;
  if (typeof indexOrId === 'number') item = exampleCrankMaps[indexOrId];
  else item = exampleCrankMaps.find(it => it.id === String(indexOrId));
  if (!item) throw new Error('example crank map not found for ' + indexOrId);

  const idx = exampleCrankMaps.indexOf(item);
  var idxStr = (idx + 1).toString();
  if (idxStr.length < 2) idxStr = '0' + idxStr;
  console.log('Running test ' + idxStr + ': ' + item.description);
  const newResults = await performRun(item.crankserial);

  // Build expected array in order
  var expected = item.expected || {};
  var expectedArray = [
    expected.podoqcresult,
    expected.autocalresult,
    expected.vmresult,
    expected.autopptresult,
    expected.temptestresult,
    expected.oqcresult,
    expected.findmyresult,
  ];

  var testNames = ['podoqcresult','autocalresult','vmresult','autopptresult','temptestresult','oqcresult','findmyresult'];
  var mismatches = [];
  for (var i = 0; i < expectedArray.length; i++) {
    var exp = expectedArray[i];
  var ok = (typeof exp !== 'undefined' && exp !== null) ? true : false;
    if (!ok) {
      mismatches.push({ index: i, name: testNames[i], got: got, expected: exp });
    }
  }

  var pass = mismatches.length === 0;

  return { newResults: newResults, expected: expectedArray, pass: pass, mismatches: mismatches };
}

// Export the function for debugging
/**
 * Build and POST the same payload App.js sends to persist a run result.
 * Returns the save response JSON.
 */
async function uploadRunForItem(item, opts = {}) {
  const newResults = await performRun(item.crankserial);
  // performRun now returns numeric codes directly
  const numericResults = newResults;

  // Compute bitmask resultcode: set bit i when numericResults[i] === 1 (FAIL)
  const resultcode = numericResults.reduce((acc, val, idx) => {
    return val === 1 ? acc | (1 << idx) : acc;
  }, 0);

  const payload = {
    crankserialnumber: item.crankserial,
    factoryid: opts.factoryid || 'AH',
    stationid: opts.stationid || 'debug-runner',
    duration: typeof opts.duration !== 'undefined' ? opts.duration : 60,
    swversion: opts.swversion || 'debug',
    apiversion: opts.apiversion || '0.0.1',
    resultcode,
    podoqcresult: numericResults[0],
    autocalresult: numericResults[1],
    vmresult: numericResults[2],
    autopptresult: numericResults[3],
    temptestresult: numericResults[4],
    oqcresult: numericResults[5],
    findmyresult: numericResults[6],
  };

  console.log('Uploading run for', item.crankserial, 'payload:', payload);

  try {
    const resp = await fetch(`${BACKEND_URL}/api/devicecrankoqcrunresults`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let jr = null;
    try {
      jr = await resp.json();
    } catch (e) {
      jr = { status: resp.status };
    }
    console.log('Upload response for', item.crankserial, ':', resp.status, jr);
    return { httpStatus: resp.status, body: jr, item, newResults, numericResults };
  } catch (err) {
    console.error('Upload error for', item.crankserial, err);
    throw err;
  }
}

/**
 * Iterate over the exampleCrankMaps and upload each example's run results.
 * Useful for exercising the backend insert endpoint from the debug runner.
 */
async function testUploadExampleCrankMap() {
  for (let i = 0; i < exampleCrankMaps.length; i++) {
    const item = exampleCrankMaps[i];
    console.log(`\n=== Uploading example ${i + 1} ${item.crankserial} ===`);
    try {
      const res = await uploadRunForItem(item);
      console.log('Upload result:', res);
    } catch (err) {
      console.error('Upload failed for example', item.crankserial, err);
    }
    // small delay between uploads
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('\nAll uploads complete.');
}

module.exports = { exampleCrankMaps, performRun, runExampleTestByIndex, uploadRunForItem, testUploadExampleCrankMap };
