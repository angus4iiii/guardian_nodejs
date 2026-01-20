const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());

// Centralized helper to apply CORS headers for both preflight and actual responses
function applyCorsHeaders(req, res) {
   const reqOrigin = req.headers['origin'];
   const found = accessControlAllowOrigin.find(origin => origin === reqOrigin);

   if (found) {
      res.setHeader('Access-Control-Allow-Origin', found);
      res.setHeader('Access-Control-Allow-Headers', '*');
      return true;
   }
   return false;
}
// Allowed origins for CORS
const accessControlAllowOrigin = [
   'http://localhost:3000',
   'https://dev.4iiiize.com',
];

app.options('/*splat', (req, res) => {
   applyCorsHeaders(req, res);

   // MUST end the preflight response otherwise the browser will keep it pending
   res.status(204).send();
});

app.post('/*splat', (req, res, next) => {
   applyCorsHeaders(req, res);
   next();
});

app.get('/*splat', (req, res, next) => {
   applyCorsHeaders(req, res);
   next();
});

const PORT = process.env.PORT || 3001;

// Read DB credentials for frankfurtdb
const credsFrankfurtPath = path.join(__dirname, 'db-creds-test.json');
const dbCredsFrankfurt = JSON.parse(
   fs.readFileSync(credsFrankfurtPath, 'utf8')
);

// Read DB credentials for skynet3
const credsSkynetPath = path.join(__dirname, 'db-creds-test-skynet.json');
const dbCredsSkynet = JSON.parse(fs.readFileSync(credsSkynetPath, 'utf8'));

const dbFrankfurt = mysql.createPool({
   host: dbCredsFrankfurt.host,
   user: dbCredsFrankfurt.user,
   password: dbCredsFrankfurt.password,
   database: dbCredsFrankfurt.database,
   port: dbCredsFrankfurt.port,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
});

const dbSkynet = mysql.createPool({
   host: dbCredsSkynet.host,
   user: dbCredsSkynet.user,
   password: dbCredsSkynet.password,
   database: dbCredsSkynet.database,
   port: dbCredsSkynet.port,
   waitForConnections: true,
   connectionLimit: 10,
   queueLimit: 0,
});

// Test pool connectivity on startup (optional; enable by setting DB_STARTUP_CHECK=1)
if (process.env.DB_STARTUP_CHECK === '1') {
   dbFrankfurt.getConnection((err, connection) => {
      if (err) {
         console.error('Error getting connection from frankfurtdb pool:', err);
      } else {
         console.log('Connected to frankfurtdb pool');
         connection.release();
      }
   });

   dbSkynet.getConnection((err, connection) => {
      if (err) {
         console.error('Error getting connection from skynet3 pool:', err);
      } else {
         console.log('Connected to skynet3 pool');
         connection.release();
      }
   });
} else {
   console.log('DB startup connectivity check disabled. Set DB_STARTUP_CHECK=1 to enable.');
}

// Route for Device Calibration Results
app.post('/api/autocal', (req, res) => {
   const { crankSerialNumber } = req.body;
   if (!crankSerialNumber) {
      console.log('Missing crankSerialNumber in request body');
      return res.status(400).json({ error: 'Missing crankSerialNumber' });
   }
   dbFrankfurt.query(
      'SELECT * FROM devicecalibrationrunresults WHERE crankserialnumber = ? ORDER BY datecreated DESC LIMIT 1',
      [crankSerialNumber],
      (err, results) => {
         if (!results || results.length === 0) {
            // No results found, return empty array
            return res.json({ resultcodes: [] });
         }
         if (err) {
            console.error('DB query error:', err);
            return res.status(500).json({ error: 'Database error' });
         }
         res.json({
            resultcodes: results.map(r => Number(r.resultcode)),
            variationmetric: results.map(r => parseFloat(r.variationmetric)),
         });
      }
   );
});

// Route for AutoPPT test
app.post('/api/autoppt', (req, res) => {
   const { crankSerial } = req.body;
   if (!crankSerial) {
      return res.status(400).json({ error: 'Missing crankSerial' });
   }
   dbFrankfurt.query(
      'SELECT resultcode FROM devicepressuretestvalues WHERE crankserialnumber = ? ORDER BY datecreated DESC LIMIT 1',
      [crankSerial],
      (err, results) => {
         if (!results || results.length === 0) {
            // No results found, return empty array
            return res.json({ resultcodes: [] });
         }
         if (err) {
            return res.status(500).json({ error: 'Database error' });
         }
         // Convert resultcode to number, removing leading zeros
         res.json({ resultcodes: results.map(r => Number(r.resultcode)) });
      }
   );
});

// Route for Pod OQC test
app.post('/api/podoqc', (req, res) => {
   const { crankSerial } = req.body;
   if (!crankSerial) {
      return res.status(400).json({ error: 'Missing crankSerial' });
   }
   dbFrankfurt.query(
      `SELECT devicepodoqcdata.resultcode FROM devicecalibrationcrankinfo dci INNER JOIN devicecalibrationng dcn ON dci.calid = dcn.calid INNER JOIN devicepodoqcdata ON dcn.serialnumber = devicepodoqcdata.serialnumber WHERE dci.crankserialnumber = ? ORDER BY devicepodoqcdata.datecreated DESC LIMIT 1`,
      [crankSerial],
      (err, results) => {
         if (!results || results.length === 0) {
            // No results found, return empty array
            return res.json({ resultcodes: [] });
         }
         if (err) {
            return res.status(500).json({ error: 'Database error' });
         }
         // Convert resultcode to number, removing leading zeros
         res.json({ resultcodes: results.map(r => Number(r.resultcode)) });
      }
   );
});

// Route for Temp Test
app.post('/api/temptest', (req, res) => {
   const { crankSerial } = req.body;
   if (!crankSerial) {
      return res.status(400).json({ error: 'Missing crankSerial' });
   }
   dbFrankfurt.query(
      'SELECT resultcode FROM devicetemperaturerunresults WHERE crankserialnumber = ? ORDER BY datecreated DESC LIMIT 1',
      [crankSerial],
      (err, results) => {
         if (!results || results.length === 0) {
            // No results found, return empty array
            return res.json({ resultcodes: [] });
         }
         if (err) {
            return res.status(500).json({ error: 'Database error' });
         }
         // Convert resultcode to number, removing leading zeros
         res.json({ resultcodes: results.map(r => Number(r.resultcode)) });
      }
   );
});

// Route for OQC Status via joined tables
// Expects { crankSerial } and returns { resultcodes: [0|1] } where 0=PASS, 1=FAIL
app.post('/api/oqcstatus', (req, res) => {
   const { crankSerial } = req.body;
   if (!crankSerial) {
      return res.status(400).json({ error: 'Missing crankSerial' });
   }
   const sql = `SELECT oq.oqcstatus
                FROM deviceoqctestinfo oq
                INNER JOIN devicecalibrationng ng ON ng.serialnumber = oq.serialnumber
                INNER JOIN devicecalibrationcrankinfo c ON c.calid = ng.calid
                WHERE c.crankserialnumber = ?
                ORDER BY oq.datecreated DESC
                LIMIT 1`;
   dbFrankfurt.query(sql, [crankSerial], (err, results) => {
      if (err) {
         console.error('DB query error (oqcstatus):', err);
         return res.status(500).json({ error: 'Database error' });
      }
      // Log the raw query results for CI visibility
      console.log('OQCSTATUS query results for', crankSerial, ':', results);

      if (!results || results.length === 0) {
         return res.json({ resultcodes: [] });
      }
      const status = results[0].oqcstatus;
      const code = String(status).toUpperCase() === 'PASS' ? 0 : 1;
      return res.json({ resultcodes: [code] });
   });
});

// New endpoint to return crankSide for a given productionsn
// Accepts query param ?productionsn= or uses a default example if not provided
app.get('/api/crankside', (req, res) => {
   const productionsn = req.query.productionsn || 'A0S10B25|41|00493';

   try {
      dbSkynet.query(
         'SELECT side FROM crank_serials WHERE productionsn = ? ORDER BY id DESC LIMIT 1',
         [productionsn],
         (err, results) => {
            if (err) {
               console.error('Error querying crank_serials:', err);
               return res.status(500).json({ error: 'Database error' });
            }

            const crankSide = results && results.length > 0 ? results[0].side : null;
            return res.json({ crankSide });
         }
      );
   } catch (e) {
      console.error('Exception while querying crank_serials:', e && e.message);
      return res.status(500).json({ error: 'Database error' });
   }
});

// Route for Progress Events
app.post('/api/progressevents', (req, res) => {
   const { productionsn } = req.body;
   if (!productionsn) {
      return res.status(400).json({ error: 'Missing productionsn' });
   }
   dbSkynet.query(
      'SELECT event FROM crank_progress_events WHERE productionsn = ? ORDER BY id DESC',
      [productionsn],
      (err, results) => {
         if (!results || results.length === 0) {
            // No results found, return empty array
            return res.json({ resultcodes: [] });
         }
         if (err) {
            return res.status(500).json({ error: 'Database error' });
         }
         // Return all event rows
         res.json({ events: results.map(r => r.event) });
      }
   );
});

// Insert Device Crank OQC Run Results
// Expects JSON body with: crankserialnumber, factoryid, stationid, duration, swversion, apiversion, resultcode
app.post('/api/devicecrankoqcrunresults', (req, res) => {
   const {
      crankserialnumber,
      factoryid,
      stationid,
      duration,
      swversion,
      apiversion,
      resultcode,
      podoqcresult,
      autocalresult,
      vmresult,
      autopptresult,
      temptestresult,
      oqcresult,
      findmyresult,
   } = req.body || {};

   // Basic validation
   if (!crankserialnumber) {
      return res.status(400).json({ error: 'Missing crankserialnumber' });
   }
   if (typeof resultcode === 'undefined' || resultcode === null) {
      return res.status(400).json({ error: 'Missing resultcode' });
   }

   const insertSql = `INSERT INTO guardianrunresults (crankserialnumber, factoryid, stationid, duration, swversion, apiversion, resultcode, podoqcresult, autocalresult, vmresult, autopptresult, temptestresult, oqcresult, findmyresult, datecreated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
   const params = [
      crankserialnumber,
      factoryid || null,
      stationid || null,
      typeof duration !== 'undefined' ? duration : null,
      swversion || null,
      apiversion || null,
      resultcode,
      typeof podoqcresult !== 'undefined' ? podoqcresult : null,
      typeof autocalresult !== 'undefined' ? autocalresult : null,
      typeof vmresult !== 'undefined' ? vmresult : null,
      typeof autopptresult !== 'undefined' ? autopptresult : null,
      typeof temptestresult !== 'undefined' ? temptestresult : null,
      typeof oqcresult !== 'undefined' ? oqcresult : null,
      typeof findmyresult !== 'undefined' ? findmyresult : null,
   ];

   dbSkynet.query(insertSql, params, (err, result) => {
      if (err) {
         console.error('Error inserting guardianrunresults:', err);
         return res.status(500).json({ error: 'Database insert error', details: err.message });
      }
      return res.json({ insertId: result.insertId, affectedRows: result.affectedRows });
   });
});

app.listen(PORT, () => {
   console.log(`Backend server listening on port ${PORT}`);
});

// Graceful shutdown: close pools on SIGINT/SIGTERM
function shutdown() {
   console.log('Shutting down server, closing MySQL pools...');
   dbFrankfurt.end(err => {
      if (err) console.error('Error closing frankfurtdb pool:', err);
   });
   dbSkynet.end(err => {
      if (err) console.error('Error closing skynet3 pool:', err);
   });
   process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
