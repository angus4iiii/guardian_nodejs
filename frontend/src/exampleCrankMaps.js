// Array of example test cases with expected numeric per-test results
// Numeric mapping: 0 = PASS, 1 = FAIL, 2 = NO DATA, 3 = NOT RUN
const exampleCrankMaps = [
  {
    id: '001',
    crankserial: 'A1S18A25|40|02304',
    description: 'DS with VM 0.73',
    expected: {
      podoqcresult: 0,
      autocalresult: 0,
      vmresult: 0,
      autopptresult: 1,
      temptestresult: 0,
      oqcresult: 0,
      findmyresult: 3,
    },
  },
  {
    id: '002',
    crankserial: 'A0S18B25|39|01368',
    description: "Fake PO's with cranks at various states",
    expected: {
      podoqcresult: 2,
      autocalresult: 1,
      vmresult: 1,
      autopptresult: 1,
      temptestresult: 1,
      oqcresult: 0,
      findmyresult: 0,
    },
  },
  {
    id: '003',
    crankserial: 'A1S9C24|47|00676',
    description: 'Drive Side example',
    expected: {
      podoqcresult: 2,
      autocalresult: 0,
      vmresult: 0,
      autopptresult: 1,
      temptestresult: 1,
      oqcresult: 0,
      findmyresult: 3,
    },
  },
  {
    id: '004',
    crankserial: 'A0S18B25|34|00697',
    description: 'Non Drive Side, August gauges',
    expected: {
      podoqcresult: 2,
      autocalresult: 0,
      vmresult: 0,
      autopptresult: 1,
      temptestresult: 1,
      oqcresult: 1,
      findmyresult: 1,
    },
  },
]

module.exports = { exampleCrankMaps }
