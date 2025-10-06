const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
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
      'SELECT resultcode FROM devicecalibrationrunresults WHERE crankserialnumber = ? ORDER BY datecreated DESC LIMIT 1',
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
      `SELECT devicepodoqcdata.resultcode FROM devicecalibrationcrankinfo dci INNER JOIN devicecalibrationng dcn ON dci.calid = dcn.calid INNER JOIN devicepodoqcdata ON dcn.serialnumber = devicepodoqcdata.serialnumber WHERE dci.crankserialnumber = 'A0S18C25|39|01001' ORDER BY devicepodoqcdata.datecreated DESC LIMIT 1`,
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

// Route for Progress Events
app.post('/api/progressevents', (req, res) => {
   const { productionsn } = req.body;
   if (!productionsn) {
      return res.status(400).json({ error: 'Missing productionsn' });
   }
   dbSkynet.query(
      'SELECT event FROM crank_progress_events WHERE productionsn = ? ORDER BY id DESC LIMIT 1',
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

app.listen(PORT, () => {
   console.log(`Backend server listening on port ${PORT}`);
});
