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

const dbFrankfurt = mysql.createConnection({
   host: dbCredsFrankfurt.host,
   user: dbCredsFrankfurt.user,
   password: dbCredsFrankfurt.password,
   database: dbCredsFrankfurt.database,
   port: dbCredsFrankfurt.port,
});

const dbSkynet = mysql.createConnection({
   host: dbCredsSkynet.host,
   user: dbCredsSkynet.user,
   password: dbCredsSkynet.password,
   database: dbCredsSkynet.database,
   port: dbCredsSkynet.port,
});

dbFrankfurt.connect(err => {
   if (err) {
      console.error('Error connecting to frankfurtdb:', err);
   } else {
      console.log('Connected to frankfurtdb');
   }
});

dbSkynet.connect(err => {
   if (err) {
      console.error('Error connecting to skynet3:', err);
   } else {
      console.log('Connected to skynet3');
   }
});

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

   console.log('Insert devicecrankoqcrunresults called with body:', req.body);
   console.log('Insert SQL:', insertSql);
   console.log('Insert params:', params);
   console.log('Per-test results:', { podoqcresult, autocalresult, vmresult, autopptresult, temptestresult, oqcresult, findmyresult });

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
