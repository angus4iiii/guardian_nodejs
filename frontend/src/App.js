import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [crankSerial, setCrankSerial] = useState("");
  const [results, setResults] = useState(["", ""]);
  const tests = [
    { name: "Pod OQC" },
    { name: "AutoCal" },
    { name: "VM <= 0.6" },
    { name: "Auto PPT" },
    { name: "Temp Test" },
    { name: "OQC" },
    { name: "FindMy" },
    // Add more tests as needed
  ];

  const inputRef = useRef(null);
  const resetBtnRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = async (e) => {
    if (e.key === "Enter") {
      let newResults = Array(tests.length).fill("");
      // Pod OQC
      try {
        const podoqcResponse = await fetch('/api/podoqc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crankSerial: crankSerial })
        });
        if (podoqcResponse.ok) {
          const podoqcData = await podoqcResponse.json();
          if (podoqcData.resultcodes && podoqcData.resultcodes.length > 0) {
            newResults[0] = podoqcData.resultcodes[0] === 0 ? "PASS" : "FAIL";
          } else {
            newResults[0] = "FAIL";
          }
        } else {
          newResults[0] = "FAIL";
        }
      } catch (err) {
        newResults[0] = "FAIL";
        console.error('API error:', err);
      }
      // AutoCal
      try {
        const response = await fetch('/api/autocal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crankSerialNumber: crankSerial })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.resultcodes && data.resultcodes.length > 0) {
            newResults[1] = data.resultcodes[0] === 0 ? "PASS" : "FAIL";
            newResults[2] = data.variationmetric[0] <= 0.6 ? "PASS" : "FAIL";
          } else {
            newResults[1] = "FAIL";
            newResults[2] = "FAIL";
          }
        } else {
           newResults[1] = "FAIL";
           newResults[2] = "FAIL";
        }
      } catch (err) {
        newResults[1] = "FAIL";
        newResults[2] = "FAIL";
        console.error('API error:', err);
      }
      // Auto PPT
      try {
        const pptResponse = await fetch('/api/autoppt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crankSerial: crankSerial })
        });
        if (pptResponse.ok) {
          const pptData = await pptResponse.json();
          if (pptData.resultcodes && pptData.resultcodes.length > 0) {
            newResults[3] = pptData.resultcodes[0] === 0 ? "PASS" : "FAIL";
          } else {
            newResults[3] = "FAIL";
          }
        } else {
          newResults[3] = "FAIL";
        }
      } catch (err) {
        newResults[3] = "FAIL";
        console.error('API error:', err);
      }
      // Temp Test
      try {
        const tempResponse = await fetch('/api/temptest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crankSerial: crankSerial })
        });
        if (tempResponse.ok) {
          const tempData = await tempResponse.json();
          if (tempData.resultcodes && tempData.resultcodes.length > 0) {
            newResults[4] = tempData.resultcodes[0] === 0 ? "PASS" : "FAIL";
          } else {
            newResults[4] = "FAIL";
          }
        } else {
          newResults[4] = "FAIL";
        }
      } catch (err) {
        newResults[4] = "FAIL";
        console.error('API error:', err);
      }
      // OQC
      try {
        const oqcResponse = await fetch('/api/progressevents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productionsn: crankSerial })
        });
        if (oqcResponse.ok) {
          const oqcData = await oqcResponse.json();
          if (oqcData.events && oqcData.events.some(ev => typeof ev === 'string' && ev.includes('OQC PASS'))) {
            newResults[5] = "PASS";
          } else {
            newResults[5] = "FAIL";
          }
        } else {
          newResults[5] = "FAIL";
        }
      } catch (err) {
        newResults[5] = "FAIL";
        console.error('API error:', err);
      }
      // FindMy
      try {
        const oqcResponse = await fetch('/api/progressevents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productionsn: crankSerial })
        });
        if (oqcResponse.ok) {
          const oqcData = await oqcResponse.json();
          if (oqcData.events && oqcData.events.some(ev => typeof ev === 'string' && ev.includes('FindMy PASS'))) {
            newResults[6] = "PASS";
          } else {
            newResults[6] = "FAIL";
          }
        } else {
          newResults[6] = "FAIL";
        }
      } catch (err) {
        newResults[6] = "FAIL";
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
    <div className="App" style={{ padding: '2rem', maxWidth: 600, margin: 'auto' }}>
      <h2>Crank Serial Number</h2>
      <input
        ref={inputRef}
        type="text"
        value={crankSerial}
        onChange={e => setCrankSerial(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter crank serial number"
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: '2rem' }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Test</th>
            <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{test.name}</td>
              <td
                style={{
                  border: '1px solid #ccc',
                  padding: '0.5rem',
                  backgroundColor:
                    results[idx] === "PASS"
                      ? '#b6f5b6'
                      : results[idx] === "FAIL"
                      ? '#f5b6b6'
                      : 'inherit',
                  color:
                    results[idx] === "PASS"
                      ? '#1a4d1a'
                      : results[idx] === "FAIL"
                      ? '#a41a1a'
                      : 'inherit',
                  fontWeight: results[idx] === "PASS" || results[idx] === "FAIL" ? 'bold' : 'normal',
                  textAlign: 'center'
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
          setCrankSerial("");
          setResults(Array(tests.length).fill(""));
          if (inputRef.current) inputRef.current.focus();
        }}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          backgroundColor: '#eee',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset
      </button>
    </div>
  );
}

export default App;
