import React, { useState, useRef, useEffect } from 'react'
import pkg from '../package.json'
import './App.css'
import { runSequence } from './runSequence'

function App() {
  const [crankSerial, setCrankSerial] = useState('')
  const [results, setResults] = useState(['', ''])
  const tests = [
    { name: 'Pod OQC' },
    { name: 'AutoCal' },
    { name: 'VM' },
    { name: 'Auto PPT' },
    { name: 'Temp Test' },
    { name: 'OQC' },
    { name: 'FindMy' },
    // Add more tests as needed
  ]

  const inputRef = useRef(null)
  const resetBtnRef = useRef(null)
  const version = pkg.version
  const [changelog, setChangelog] = useState(null)
  const [crankSide, setCrankSide] = useState(null)
  // vmThresholdNumeric used for comparisons; vmThresholdDisplay used for UI
  const vmThresholdNumeric = String(crankSide) === '1' ? 0.75 : 0.6
  const vmThresholdDisplay = crankSide === null ? '?' : vmThresholdNumeric.toFixed(2)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    // Fetch README from repo root and extract Changelog section
    fetch('../../README.md')
      .then((res) => res.text())
      .then((text) => {
        const changelogIndex = text.indexOf('## Changelog')
        if (changelogIndex !== -1) {
          setChangelog(text.slice(changelogIndex))
        } else {
          setChangelog(text)
        }
      })
      .catch(() => setChangelog(null))
  }, [])

  const handleKeyDown = async (e) => {
    if (e.key === 'Tab') {
      // On Tab, move focus to the Reset button
      e.preventDefault()
      if (resetBtnRef.current) resetBtnRef.current.focus()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      // use shared runSequence to get numeric results
      try {
        const { numericResults, crankSide: cs } = await runSequence(crankSerial)
        // update UI display values (convert numeric back to human text)
        const mapBack = (r) => {
          if (r === 0) return 'PASS'
          if (r === 1) return 'FAIL'
          if (r === 2) return 'NO DATA'
          if (r === 3) return 'NOT RUN'
          return 'NO DATA'
        }
        setResults(numericResults.map(mapBack))
        setCrankSide(cs)
      } catch (err) {
        console.error('Error running sequence:', err)
      }

      // Keep focus on the input and select all text
      if (inputRef.current) {
        try {
          inputRef.current.focus()
          inputRef.current.select()
        } catch (e) {
          // ignore
        }
      }
    }
  }
  // expose dev hook so tests can inject serials into the real frontend and read results
  if (typeof window !== 'undefined') {
    window.runCrankSerial = async function (serial) {
      const { numericResults, crankSide: cs } = await runSequence(serial)
      // store human-readable and numeric on window for tests
      window._latestRun = {
        numericResults,
        humanResults: numericResults.map((r) =>
          r === 0 ? 'PASS' : r === 1 ? 'FAIL' : r === 2 ? 'NO DATA' : 'NOT RUN'
        ),
        crankSide: cs,
      }
      // also update the UI if mounted
      return window._latestRun
    }
  }

  return (
    <div className="App" style={{ padding: '2rem', maxWidth: 600, margin: 'auto' }}>
      <h2>Crank Serial Number</h2>
      <input
        ref={inputRef}
        type="text"
        value={crankSerial}
        onChange={(e) => setCrankSerial(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={() => {
          if (inputRef.current) {
            try {
              inputRef.current.select()
            } catch (e) {}
          }
        }}
        onFocus={() => {
          if (inputRef.current) {
            try {
              inputRef.current.select()
            } catch (e) {}
          }
        }}
        placeholder="Enter crank serial number"
        style={{
          width: '100%',
          padding: '0.5rem',
          fontSize: '1rem',
          marginBottom: '2rem',
        }}
      />
      <div style={{ marginBottom: '1rem', fontSize: '0.95rem', color: '#333' }}>
        <strong>Crank side:</strong>{' '}
        {crankSide === null
          ? 'Unknown'
          : String(crankSide) === '0'
          ? 'Non-Drive Side'
          : String(crankSide) === '1'
          ? 'Drive Side'
          : String(crankSide)}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th
              style={{
                border: '1px solid #ccc',
                padding: '0.5rem',
                textAlign: 'left',
                width: '30%',
              }}
            >
              Test
            </th>
            <th
              style={{
                border: '1px solid #ccc',
                padding: '0.5rem',
                textAlign: 'left',
                width: '55%',
              }}
            >
              Result
            </th>
            <th
              style={{
                border: '1px solid #ccc',
                padding: '0.5rem',
                textAlign: 'left',
                width: '15%',
              }}
            >
              Fails
            </th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>
                {idx === 2 ? `VM <= ${vmThresholdDisplay}` : test.name}
              </td>
              <td
                style={{
                  border: '1px solid #ccc',
                  padding: '0.5rem',
                  width: '25%',
                  backgroundColor:
                    results[idx] === 'PASS'
                      ? '#b6f5b6'
                      : results[idx] === 'FAIL'
                      ? '#f5b6b6'
                      : results[idx] === 'NO DATA' || results[idx] === 'NOT RUN'
                      ? '#e8e8e8'
                      : 'inherit',
                  color:
                    results[idx] === 'PASS'
                      ? '#1a4d1a'
                      : results[idx] === 'FAIL'
                      ? '#a41a1a'
                      : results[idx] === 'NO DATA' || results[idx] === 'NOT RUN'
                      ? '#666666'
                      : 'inherit',
                  fontWeight:
                    results[idx] === 'PASS' ||
                    results[idx] === 'FAIL' ||
                    results[idx] === 'NO DATA' ||
                    results[idx] === 'NOT RUN'
                      ? 'bold'
                      : 'normal',
                  textAlign: 'center',
                }}
              >
                {results[idx]}
              </td>
              <td
                style={{
                  border: '1px solid #ccc',
                  padding: '0.5rem',
                  width: '10%',
                  backgroundColor: '#e8e8e8',
                  color: '#666666',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                NO DATA
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        ref={resetBtnRef}
        onClick={() => {
          setCrankSerial('')
          setResults(Array(tests.length).fill(''))
          setCrankSide(null)
          if (inputRef.current) inputRef.current.focus()
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
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            marginTop: '0.5rem',
            maxHeight: 200,
            overflow: 'auto',
          }}
        >
          {changelog || 'Changelog not available.'}
        </pre>
      </div>
    </div>
  )
}

export default App
