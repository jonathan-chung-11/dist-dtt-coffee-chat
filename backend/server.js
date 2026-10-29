const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const { execFile } = require('child_process');

const app = express();
app.use(cors());
// Raised limit so an uploaded GIF (stored as a base64 data URL in settings) isn't rejected
app.use(express.json({ limit: '25mb' }));

const DATA_FILE = path.join(__dirname, '../data/pairings.json');
const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');
const EXCEL_FILE = path.join(__dirname, '../data/coffee_chat_history.xlsx');

const DEFAULT_EMAIL_TEMPLATE = `Hi Name1 and Name2,

Hey there! It's time for our monthly coffee chat.

Coffee chats help foster meaningful conversations and build new and existing friendships within our group. We recommend the below practices for coffee chats:
1. Find a common 15-30 minute window to meet by the end of the month.
2. Coffee is optional, but turning on your video is highly recommended! Having your camera on encourages conversation and relationship building.
3. Take a screenshot of your chat and share it in the dist_dtt_general Slack channel along with a summary of your conversation. It's great to see everyone enjoying coffee chats.

Name2, for this cycle you will be responsible for setting up the coffee chat. Please reach out if you have any difficulty setting up a common time that works.

To help drive some conversation, feel free to use the below questions:
1. What's your favorite way to reset or recharge at the start of a new year?
2. What was the highlight of your year last year?
3. What's your go-to way to beat the January blues?



Best,
Raj

______________________________
Rajkamal Singh
Data & Technology Transformation
New York, NY`;

const DEFAULT_GROUP_TEMPLATE = `Hi Name1, Name2, and the rest of the group,

Hey there! It's time for our quarterly coffee chat circle.

Coffee chats help foster meaningful conversations and build new and existing friendships within our group. We recommend the below practices for coffee chats:
1. Find a common 30-45 minute window to meet by the end of the quarter.
2. Coffee is optional, but turning on your video is highly recommended! Having your camera on encourages conversation and relationship building.
3. Take a screenshot of your chat and share it in the dist_dtt_general Slack channel along with a summary of your conversation. It's great to see everyone enjoying coffee chats.

Name1, for this cycle you will be responsible for setting up the coffee chat. Please reach out to the group if you have any difficulty finding a common time that works.

To help drive some conversation, feel free to use the below questions:
1. What's your favorite way to reset or recharge at the start of a new year?
2. What was the highlight of your year last year?
3. What's your go-to way to beat the January blues?



Best,
Raj

______________________________
Rajkamal Singh
Data & Technology Transformation
New York, NY`;

// ======= SETTINGS =======

function initSettings() {
  if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    const defaults = {
      senderName: 'Raj',
      smtpHost: 'smtp.office365.com',
      smtpPort: 587,
      smtpUser: '',
      // smtpPassword is intentionally NEVER stored here
      emailSubject: 'Coffee Chat Time! ☕',
      emailTemplate: DEFAULT_EMAIL_TEMPLATE,
      groupEmailTemplate: DEFAULT_GROUP_TEMPLATE,
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaults, null, 2));
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// ======= DATA =======

function initData() {
  if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      people: [
        { name: "Huda Khatoon", email: "" },
        { name: "Shalva Anuashvili", email: "" },
        { name: "Emily Richards", email: "" },
        { name: "Smruthi Raj Mohan", email: "" },
        { name: "Rohan Swaby", email: "" },
        { name: "David Hinton", email: "" },
        { name: "Kara Vohra", email: "" },
        { name: "Brielle Kolf", email: "" },
        { name: "Ava Harnick", email: "" },
        { name: "Shweta Mayekar", email: "" },
        { name: "Connie He", email: "" },
        { name: "Matt Epstein", email: "" },
        { name: "Daniel Rosini", email: "" },
        { name: "Archna Saxena", email: "" },
        { name: "Dave Roglieri", email: "" },
        { name: "Michael Saenz", email: "" },
        { name: "Albert Chen", email: "" },
        { name: "Hennah Nazari", email: "" },
        { name: "Romit Bhatia", email: "" },
        { name: "Rajkamal Singh", email: "" },
      ],
      history: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  // Migrate people from string[] to object[] if needed
  if (data.people.length > 0 && typeof data.people[0] === 'string') {
    data.people = data.people.map(name => ({ name, email: '' }));
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  return data;
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  exportToExcel(data);
}

// Helper: get name from person (handles both string and object format)
function getName(person) {
  return typeof person === 'string' ? person : person.name;
}

function exportToExcel(data) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryRows = [['Year', 'Month/Quarter', 'Type', 'Participants']];
  for (const [year, yearData] of Object.entries(data.history)) {
    if (yearData.monthly) {
      for (const [month, pairs] of Object.entries(yearData.monthly)) {
        for (const pair of pairs) {
          summaryRows.push([year, month, '1-on-1', pair.join(' & ')]);
        }
      }
    }
    if (yearData.quarterly) {
      for (const [quarter, groups] of Object.entries(yearData.quarterly)) {
        for (const group of groups) {
          summaryRows.push([year, quarter, 'Group of 5', group.join(', ')]);
        }
      }
    }
  }
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'All Pairings');

  // Per year sheets
  for (const [year, yearData] of Object.entries(data.history)) {
    const rows = [['Month/Quarter', 'Type', 'Person 1', 'Person 2', 'Person 3', 'Person 4', 'Person 5']];
    if (yearData.monthly) {
      for (const [month, pairs] of Object.entries(yearData.monthly)) {
        for (const pair of pairs) {
          rows.push([month, '1-on-1', ...pair]);
        }
      }
    }
    if (yearData.quarterly) {
      for (const [quarter, groups] of Object.entries(yearData.quarterly)) {
        for (const group of groups) {
          rows.push([quarter, 'Group of 5', ...group]);
        }
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Year ${year}`);
  }

  XLSX.writeFile(wb, EXCEL_FILE);
}

// Get all past pairs for a given year (to avoid repeats)
function getPastPairsForYear(history, year) {
  const pairs = new Set();
  const yearData = history[year] || {};

  if (yearData.monthly) {
    for (const monthPairs of Object.values(yearData.monthly)) {
      for (const pair of monthPairs) {
        const key = [...pair].sort().join('|');
        pairs.add(key);
      }
    }
  }
  return pairs;
}

// Generate 1-on-1 pairings using round-robin, avoiding past pairs
function generateOneOnOnePairs(people, usedPairs) {
  const names = people.map(getName);
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  const pairs = [];
  const used = new Set();
  const attempted = new Set();

  for (let i = 0; i < shuffled.length; i++) {
    if (used.has(shuffled[i])) continue;
    for (let j = i + 1; j < shuffled.length; j++) {
      if (used.has(shuffled[j])) continue;
      const key = [shuffled[i], shuffled[j]].sort().join('|');
      if (!usedPairs.has(key) && !attempted.has(key)) {
        pairs.push([shuffled[i], shuffled[j]]);
        used.add(shuffled[i]);
        used.add(shuffled[j]);
        attempted.add(key);
        break;
      }
    }
  }

  // If someone is left unpaired (odd number), add to last pair as triple
  const unpaired = shuffled.filter(p => !used.has(p));
  if (unpaired.length > 0 && pairs.length > 0) {
    pairs[pairs.length - 1].push(...unpaired);
  }

  return pairs;
}

// Generate group of 5 pairings
function generateGroupOf5(people) {
  const names = people.map(getName);
  const shuffled = [...names].sort(() => Math.random() - 0.5);
  const groups = [];
  for (let i = 0; i < shuffled.length; i += 5) {
    const group = shuffled.slice(i, i + 5);
    if (group.length >= 3) {
      groups.push(group);
    } else if (groups.length > 0) {
      groups[groups.length - 1].push(...group);
    }
  }
  return groups;
}

// ======= ROUTES =======

// Get all data
app.get('/api/data', (req, res) => {
  const data = initData();
  res.json(data);
});

// Get people list
app.get('/api/people', (req, res) => {
  const data = initData();
  res.json(data.people);
});

// Update people list (accepts array of {name, email} objects)
app.put('/api/people', (req, res) => {
  const data = initData();
  data.people = req.body.people;
  saveData(data);
  res.json({ success: true, people: data.people });
});

// Update a single person's email
app.put('/api/people/:name/email', (req, res) => {
  const data = initData();
  const { name } = req.params;
  const { email } = req.body;
  const person = data.people.find(p => getName(p) === name);
  if (!person) return res.status(404).json({ success: false, message: 'Person not found' });
  person.email = email;
  saveData(data);
  res.json({ success: true, person });
});

// Generate monthly 1-on-1 pairs
app.post('/api/generate/monthly', (req, res) => {
  const { year, month } = req.body;
  const data = initData();

  if (!data.history[year]) data.history[year] = {};
  if (!data.history[year].monthly) data.history[year].monthly = {};

  if (data.history[year].monthly[month]) {
    return res.json({
      success: false,
      message: `Pairs for ${month} ${year} already exist. Delete them first to regenerate.`,
      pairs: data.history[year].monthly[month]
    });
  }

  const usedPairs = getPastPairsForYear(data.history, year);
  const pairs = generateOneOnOnePairs(data.people, usedPairs);

  data.history[year].monthly[month] = pairs;
  saveData(data);

  res.json({ success: true, pairs, year, month });
});

// Generate quarterly group of 5 pairs
app.post('/api/generate/quarterly', (req, res) => {
  const { year, quarter } = req.body;
  const data = initData();

  if (!data.history[year]) data.history[year] = {};
  if (!data.history[year].quarterly) data.history[year].quarterly = {};

  if (data.history[year].quarterly[quarter]) {
    return res.json({
      success: false,
      message: `Groups for ${quarter} ${year} already exist. Delete them first to regenerate.`,
      groups: data.history[year].quarterly[quarter]
    });
  }

  const groups = generateGroupOf5(data.people);
  data.history[year].quarterly[quarter] = groups;
  saveData(data);

  res.json({ success: true, groups, year, quarter });
});

// Delete a specific month's pairings
app.delete('/api/pairings/monthly/:year/:month', (req, res) => {
  const { year, month } = req.params;
  const data = initData();

  if (data.history[year]?.monthly?.[month]) {
    delete data.history[year].monthly[month];
    saveData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Not found' });
  }
});

// Delete a specific quarter's pairings
app.delete('/api/pairings/quarterly/:year/:quarter', (req, res) => {
  const { year, quarter } = req.params;
  const data = initData();

  if (data.history[year]?.quarterly?.[quarter]) {
    delete data.history[year].quarterly[quarter];
    saveData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Not found' });
  }
});

// Reset year (clear all pairings for a year)
app.delete('/api/reset/:year', (req, res) => {
  const { year } = req.params;
  const data = initData();
  delete data.history[year];
  saveData(data);
  res.json({ success: true, message: `Year ${year} has been reset.` });
});

// Download Excel
app.get('/api/export', (req, res) => {
  const data = initData();
  exportToExcel(data);
  if (fs.existsSync(EXCEL_FILE)) {
    res.download(EXCEL_FILE, 'coffee_chat_history.xlsx');
  } else {
    res.status(404).json({ message: 'No data to export yet' });
  }
});

// Get stats
app.get('/api/stats', (req, res) => {
  const data = initData();
  const stats = {
    totalPeople: data.people.length,
    yearsTracked: Object.keys(data.history).length,
    totalMonthlyPairings: 0,
    totalQuarterlyGroups: 0,
  };

  for (const yearData of Object.values(data.history)) {
    if (yearData.monthly) {
      for (const pairs of Object.values(yearData.monthly)) {
        stats.totalMonthlyPairings += pairs.length;
      }
    }
    if (yearData.quarterly) {
      for (const groups of Object.values(yearData.quarterly)) {
        stats.totalQuarterlyGroups += groups.length;
      }
    }
  }

  res.json(stats);
});

// ======= SETTINGS ROUTES =======

app.get('/api/settings', (req, res) => {
  const settings = initSettings();
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const settings = initSettings();
  // NEVER persist the password — strip it before saving
  const { smtpPassword, ...safeFields } = req.body;
  const updated = { ...settings, ...safeFields, smtpPassword: '' };
  saveSettings(updated);
  res.json({ success: true, settings: updated });
});

// ======= EMAIL ROUTES =======

app.post('/api/send-emails', async (req, res) => {
  const { emails, smtpPassword: reqPassword } = req.body;
  const settings = initSettings();

  // Password ONLY comes from the request body — never from disk
  const password = reqPassword;

  if (!settings.smtpUser) {
    return res.status(400).json({
      success: false,
      message: 'Email address not configured. Please set your email in Settings first.'
    });
  }
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'No password provided. Please enter your email password in Settings before sending.'
    });
  }

  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: settings.smtpHost || 'smtp.office365.com',
      port: parseInt(settings.smtpPort) || 587,
      secure: false,
      auth: {
        user: settings.smtpUser,
        pass: password,           // from request only, never from file
      },
      tls: { rejectUnauthorized: false }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create email transporter: ' + err.message });
  }

  const results = [];
  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: `"${settings.senderName || 'Raj'}" <${settings.smtpUser}>`,
        to: email.to.join(', '),
        subject: email.subject,
        text: email.body,
      });
      results.push({ to: email.to, label: email.label, status: 'sent' });
    } catch (err) {
      results.push({ to: email.to, label: email.label, status: 'failed', error: err.message });
    }
  }

  const allSent = results.every(r => r.status === 'sent');
  res.json({ success: allSent, results });
});

// Open a set of URLs in a brand-new Chrome window — each URL becomes its own tab.
// Used by the Pairings pages so "Open in Outlook" lands in Chrome (logged into company
// Outlook) regardless of which browser the app itself is running in.
app.post('/api/open-in-chrome', (req, res) => {
  const { urls } = req.body;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ success: false, message: 'No URLs provided' });
  }
  const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  execFile(chromeBin, ['--new-window', ...urls], (err) => {
    if (!err) return res.json({ success: true });
    // Fallback if Chrome lives elsewhere / isn't at the default path
    execFile('open', ['-na', 'Google Chrome', '--args', '--new-window', ...urls], (err2) => {
      if (err2) {
        return res.status(500).json({ success: false, message: 'Could not launch Chrome: ' + err2.message });
      }
      res.json({ success: true });
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`☕ Coffee Chat Backend running on http://localhost:${PORT}`);
  initData();
  initSettings();
});
