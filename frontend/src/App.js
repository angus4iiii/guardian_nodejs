import React, { useState, useRef, useEffect } from 'react';
import pkg from '../package.json';
import './App.css';

const BACKEND_URL = 'http://localhost:3001';

function App() {
   const [crankSerial, setCrankSerial] = useState('');
   const [results, setResults] = useState(['', '']);
   const tests = [
      { name: 'Pod OQC' },
      { name: 'AutoCal' },
      { name: 'VM <= 0.6' },
      { name: 'Auto PPT' },
      { name: 'Temp Test' },
      { name: 'OQC' },
      { name: 'FindMy' },
      // Add more tests as needed
   ];

   const inputRef = useRef(null);
   const resetBtnRef = useRef(null);
   const version = pkg.version;
   const [changelog, setChangelog] = useState(null);
   useEffect(() => {
      if (inputRef.current) {
         inputRef.current.focus();
      }
   }, []);

   useEffect(() => {
      // Fetch README from repo root and extract Changelog section
      fetch('../../README.md')
         .then(res => res.text())
         .then(text => {
            const changelogIndex = text.indexOf('## Changelog');
            if (changelogIndex !== -1) {
               setChangelog(text.slice(changelogIndex));
            } else {
               setChangelog(text);
            }
         })
         .catch(() => setChangelog(null));
   }, []);

   const handleKeyDown = async e => {
      if (e.key === 'Enter') {
         let newResults = Array(tests.length).fill('');
         // Pod OQC
         try {
            console.log('Sending POST to', `${BACKEND_URL}/api/podoqc`, {
               crankSerial,
            });
            const podoqcResponse = await fetch(`${BACKEND_URL}/api/podoqc`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ crankSerial: crankSerial }),
            });
            console.log('podoqcResponse status:', podoqcResponse.status);
            if (podoqcResponse.ok) {
               const podoqcData = await podoqcResponse.json();
               console.log('podoqcData:', podoqcData);
               if (
                  podoqcData.resultcodes &&
                  podoqcData.resultcodes.length > 0
               ) {
                  newResults[0] =
                     podoqcData.resultcodes[0] === 0 ? 'PASS' : 'FAIL';
               } else {
                  newResults[0] = 'NO DATA';
               }
            } else {
               newResults[0] = 'FAIL';
            }
         } catch (err) {
            newResults[0] = 'FAIL';
            console.error('API error:', err);
         }
         // AutoCal
         try {
            console.log('Sending POST to', `${BACKEND_URL}/api/autocal`, {
               crankSerialNumber: crankSerial,
            });
            const response = await fetch(`${BACKEND_URL}/api/autocal`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ crankSerialNumber: crankSerial }),
            });
            console.log('autocalResponse status:', response.status);
            if (response.ok) {
               const data = await response.json();
               if (data.resultcodes && data.resultcodes.length > 0) {
                  newResults[1] = data.resultcodes[0] === 0 ? 'PASS' : 'FAIL';
                  newResults[2] =
                     data.variationmetric[0] <= 0.6 ? 'PASS' : 'FAIL';
               } else {
                  newResults[1] = 'FAIL';
                  newResults[2] = 'FAIL';
               }
            } else {
               newResults[1] = 'FAIL';
               newResults[2] = 'FAIL';
            }
         } catch (err) {
            newResults[1] = 'FAIL';
            newResults[2] = 'FAIL';
            console.error('API error:', err);
         }
         // Auto PPT
         try {
            console.log('Sending POST to', `${BACKEND_URL}/api/autoppt`, {
               crankSerial,
            });
            const pptResponse = await fetch(`${BACKEND_URL}/api/autoppt`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ crankSerial: crankSerial }),
            });
            console.log('pptResponse status:', pptResponse.status);
            if (pptResponse.ok) {
               const pptData = await pptResponse.json();
               if (pptData.resultcodes && pptData.resultcodes.length > 0) {
                  newResults[3] =
                     pptData.resultcodes[0] === 0 ? 'PASS' : 'FAIL';
               } else {
                  newResults[3] = 'FAIL';
               }
            } else {
               newResults[3] = 'FAIL';
            }
         } catch (err) {
            newResults[3] = 'FAIL';
            console.error('API error:', err);
         }
         // Temp Test
         try {
            console.log('Sending POST to', `${BACKEND_URL}/api/temptest`, {
               crankSerial,
            });
            const tempResponse = await fetch(`${BACKEND_URL}/api/temptest`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ crankSerial: crankSerial }),
            });
            console.log('tempResponse status:', tempResponse.status);
            if (tempResponse.ok) {
               const tempData = await tempResponse.json();
               if (tempData.resultcodes && tempData.resultcodes.length > 0) {
                  newResults[4] =
                     tempData.resultcodes[0] === 0 ? 'PASS' : 'FAIL';
               } else {
                  newResults[4] = 'FAIL';
               }
            } else {
               newResults[4] = 'FAIL';
            }
         } catch (err) {
            newResults[4] = 'FAIL';
            console.error('API error:', err);
         }
         // OQC
         try {
            console.log(
               'Sending POST to',
               `${BACKEND_URL}/api/progressevents`,
               {
                  productionsn: crankSerial,
               }
            );
            const oqcResponse = await fetch(
               `${BACKEND_URL}/api/progressevents`,
               {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productionsn: crankSerial }),
               }
            );
            console.log('oqcResponse status:', oqcResponse.status);
            if (oqcResponse.ok) {
               const oqcData = await oqcResponse.json();
               if (
                  oqcData.events &&
                  oqcData.events.some(
                     ev => typeof ev === 'string' && ev.includes('OQC PASS')
                  )
               ) {
                  newResults[5] = 'PASS';
               } else {
                  newResults[5] = 'FAIL';
               }
            } else {
               newResults[5] = 'FAIL';
            }
         } catch (err) {
            newResults[5] = 'FAIL';
            console.error('API error:', err);
         }
         // FindMy
         try {
            const oqcResponse = await fetch(
               `${BACKEND_URL}/api/progressevents`,
               {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productionsn: crankSerial }),
               }
            );
            if (oqcResponse.ok) {
               const oqcData = await oqcResponse.json();
               if (
                  oqcData.events &&
                  oqcData.events.some(
                     ev => typeof ev === 'string' && ev.includes('FindMy PASS')
                  )
               ) {
                  newResults[6] = 'PASS';
               } else {
                  newResults[6] = 'FAIL';
               }
            } else {
               newResults[6] = 'FAIL';
            }
         } catch (err) {
            newResults[6] = 'FAIL';
            console.error('API error:', err);
         }
         setResults(newResults);
         // Move focus to Reset button
         setTimeout(() => {
            if (resetBtnRef.current) {
               resetBtnRef.current.focus();
            }
         }, 0);
      }
   };

   return (
      <div
         className="App"
         style={{ padding: '2rem', maxWidth: 600, margin: 'auto' }}
      >
         <h2>Crank Serial Number</h2>
         <input
            ref={inputRef}
            type="text"
            value={crankSerial}
            onChange={e => setCrankSerial(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter crank serial number"
            style={{
               width: '100%',
               padding: '0.5rem',
               fontSize: '1rem',
               marginBottom: '2rem',
            }}
         />
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr>
                  <th
                     style={{
                        border: '1px solid #ccc',
                        padding: '0.5rem',
                        textAlign: 'left',
                     }}
                  >
                     Test
                  </th>
                  <th
                     style={{
                        border: '1px solid #ccc',
                        padding: '0.5rem',
                        textAlign: 'left',
                     }}
                  >
                     Result
                  </th>
               </tr>
            </thead>
            <tbody>
               {tests.map((test, idx) => (
                  <tr key={idx}>
                     <td
                        style={{ border: '1px solid #ccc', padding: '0.5rem' }}
                     >
                        {test.name}
                     </td>
                     <td
                        style={{
                           border: '1px solid #ccc',
                           padding: '0.5rem',
                           backgroundColor:
                              results[idx] === 'PASS'
                                 ? '#b6f5b6'
                                 : results[idx] === 'FAIL'
                                 ? '#f5b6b6'
                                 : results[idx] === 'NO DATA'
                                 ? '#e8e8e8'
                                 : 'inherit',
                           color:
                              results[idx] === 'PASS'
                                 ? '#1a4d1a'
                                 : results[idx] === 'FAIL'
                                 ? '#a41a1a'
                                 : results[idx] === 'NO DATA'
                                 ? '#666666'
                                 : 'inherit',
                           fontWeight:
                              results[idx] === 'PASS' || results[idx] === 'FAIL' || results[idx] === 'NO DATA'
                                 ? 'bold'
                                 : 'normal',
                           textAlign: 'center',
                        }}
                     >
                        {results[idx]}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         <button
            ref={resetBtnRef}
            onClick={() => {
               setCrankSerial('');
               setResults(Array(tests.length).fill(''));
               if (inputRef.current) inputRef.current.focus();
            }}
            style={{
               marginTop: '2rem',
               padding: '0.75rem 2rem',
               fontSize: '1rem',
               backgroundColor: '#eee',
               border: '1px solid #ccc',
               borderRadius: '4px',
               cursor: 'pointer',
            }}
         >
            Reset
         </button>
           {/* Version and changelog box */}
           <div
              style={{
                 marginTop: '2rem',
                 padding: '1rem',
                 border: '1px solid #ddd',
                 borderRadius: 6,
                 backgroundColor: '#fafafa',
                 fontSize: '0.9rem',
              }}
           >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                    <strong>Version:</strong> {version || 'unknown'}
                 </div>
                 <div>
                    <em>Changelog (excerpt)</em>
                 </div>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem', maxHeight: 200, overflow: 'auto' }}>
                 {changelog || 'Changelog not available.'}
              </pre>
           </div>
      </div>
   );
}

export default App;
