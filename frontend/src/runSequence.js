const BACKEND_URL =
   process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Run the full sequence of backend calls for a crank serial and return
 * numeric test results plus crankSide.
 * Returns: { numericResults: number[], crankSide: string|null }
 * Codes: 0=PASS,1=FAIL,2=NO DATA,3=NOT RUN
 */
async function runSequence(crankSerial) {
   const tests = [0, 1, 2, 3, 4, 5, 6];
   const newResults = Array(tests.length).fill(2);
   let crankSideValue = null;
   let vmThresholdLocal = null;

   // crankside
   try {
      const csResp = await fetch(
         `${BACKEND_URL}/api/crankside?productionsn=${encodeURIComponent(
            crankSerial
         )}`
      );
      if (csResp.ok) {
         const csData = await csResp.json();
         crankSideValue =
            csData && typeof csData.crankSide !== 'undefined'
               ? csData.crankSide
               : null;
         vmThresholdLocal = String(crankSideValue) === '1' ? 0.75 : 0.6;
         if (String(crankSideValue) === '1') {
            newResults[3] = 3; // NOT RUN
            newResults[6] = 3; // NOT RUN
         }
      }
   } catch (err) {
      crankSideValue = null;
      vmThresholdLocal = null;
   }

   // Pod OQC
   try {
      const podoqcResponse = await fetch(`${BACKEND_URL}/api/podoqc`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ crankSerial }),
      });
      if (podoqcResponse.ok) {
         const podoqcData = await podoqcResponse.json();
         if (podoqcData.resultcodes && podoqcData.resultcodes.length > 0) {
            newResults[0] = podoqcData.resultcodes[0] === 0 ? 0 : 1;
         } else {
            newResults[0] = 2;
         }
      } else {
         newResults[0] = 1;
      }
   } catch (err) {
      newResults[0] = 1;
   }

   // AutoCal + VM
   try {
      const response = await fetch(`${BACKEND_URL}/api/autocal`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ crankSerialNumber: crankSerial }),
      });
      if (response.ok) {
         const data = await response.json();
         if (data.resultcodes && data.resultcodes.length > 0) {
            newResults[1] = data.resultcodes[0] === 0 ? 0 : 1;
            newResults[2] =
               data.variationmetric &&
               data.variationmetric[0] !== undefined &&
               vmThresholdLocal !== null
                  ? data.variationmetric[0] <= vmThresholdLocal
                     ? 0
                     : 1
                  : 2;
         } else {
            newResults[1] = 1;
            newResults[2] = 1;
         }
      } else {
         newResults[1] = 1;
         newResults[2] = 1;
      }
   } catch (err) {
      newResults[1] = 1;
      newResults[2] = 1;
   }

   // Auto PPT (skip if drive side)
   if (String(crankSideValue) !== '1') {
      try {
         const pptResponse = await fetch(`${BACKEND_URL}/api/autoppt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crankSerial }),
         });
         if (pptResponse.ok) {
            const pptData = await pptResponse.json();
            if (pptData.resultcodes && pptData.resultcodes.length > 0) {
               newResults[3] = pptData.resultcodes[0] === 0 ? 0 : 1;
            } else {
               newResults[3] = 1;
            }
         } else {
            newResults[3] = 1;
         }
      } catch (err) {
         newResults[3] = 1;
      }
   }

   // Temp Test
   try {
      const tempResponse = await fetch(`${BACKEND_URL}/api/temptest`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ crankSerial }),
      });
      if (tempResponse.ok) {
         const tempData = await tempResponse.json();
         if (tempData.resultcodes && tempData.resultcodes.length > 0) {
            newResults[4] = tempData.resultcodes[0] === 0 ? 0 : 1;
         } else {
            newResults[4] = 1;
         }
      } else {
         newResults[4] = 1;
      }
   } catch (err) {
      newResults[4] = 1;
   }

   // OQC
   try {
      const oqcResponse = await fetch(`${BACKEND_URL}/api/progressevents`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ productionsn: crankSerial }),
      });
      if (oqcResponse.ok) {
         const oqcData = await oqcResponse.json();
         if (
            oqcData.events &&
            oqcData.events.some(
               ev => typeof ev === 'string' && ev.includes('OQC PASS')
            )
         ) {
            newResults[5] = 0;
         } else {
            newResults[5] = 1;
         }
      } else {
         newResults[5] = 1;
      }
   } catch (err) {
      newResults[5] = 1;
   }

   // FindMy (skip if drive side)
   if (String(crankSideValue) !== '1') {
      try {
         const fmResponse = await fetch(`${BACKEND_URL}/api/progressevents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productionsn: crankSerial }),
         });
         if (fmResponse.ok) {
            const fmData = await fmResponse.json();
            if (
               fmData.events &&
               fmData.events.some(
                  ev => typeof ev === 'string' && ev.includes('FindMy PASS')
               )
            ) {
               newResults[6] = 0;
            } else {
               newResults[6] = 1;
            }
         } else {
            newResults[6] = 1;
         }
      } catch (err) {
         newResults[6] = 1;
      }
   }

   return { numericResults: newResults, crankSide: crankSideValue };
}

module.exports = { runSequence };
