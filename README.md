# ☕ Coffee Chat Pairing System

A beautiful, animated full-stack web app for managing your team's coffee chat pairings. Automatically generates 1-on-1 monthly pairs and quarterly group sessions — ensuring no pair repeats within the same year.

---

## ✨ Features

- **Monthly 1:1 Pairings** — Automatically pairs everyone each month, avoiding repeat pairs within the year
- **Quarterly Group Sessions** — Groups of 5 people for quarterly coffee chats
- **Full History** — View all pairings organized by year and month
- **People Manager** — Add or remove team members at any time
- **Excel Export** — Download full history as a `.xlsx` spreadsheet
- **Year Reset** — Reset pairings at the end of the year to start fresh
- **Beautiful Dark UI** — Animated coffee-themed interface with Framer Motion

---

## 📋 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v16 or higher
- npm (comes with Node.js)

Check your versions:
```bash
node --version
npm --version
```

---

## 🚀 Setup & Installation

### Step 1: Extract the ZIP

Unzip the project to a folder of your choice.

### Step 2: Install Backend Dependencies

```bash
cd coffee-chat-app/backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

> ⚠️ The frontend install may take 2–5 minutes as it installs React and its dependencies.

---

## ▶️ Running the App

You'll need **two terminal windows** (or tabs):

### Terminal 1 — Start the Backend
```bash
cd coffee-chat-app/backend
npm start
```
You should see: `☕ Coffee Chat Backend running on http://localhost:3001`

### Terminal 2 — Start the Frontend
```bash
cd coffee-chat-app/frontend
npm start
```
The app will automatically open in your browser at **http://localhost:3000**

---

## 🗂️ Project Structure

```
coffee-chat-app/
├── backend/
│   ├── server.js          # Express API server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main app + routing
│   │   ├── components/
│   │   │   └── Navbar.js  # Navigation bar
│   │   └── pages/
│   │       ├── Dashboard.js       # Overview & stats
│   │       ├── MonthlyPairings.js # 1:1 monthly pairs
│   │       ├── QuarterlyGroups.js # Group of 5
│   │       ├── History.js         # Full history view
│   │       └── PeopleManager.js   # Add/remove people
│   └── package.json
├── data/
│   ├── pairings.json              # All pairing data (auto-created)
│   └── coffee_chat_history.xlsx   # Excel export (auto-created)
└── README.md
```

---

## 📖 How to Use

### Monthly 1:1 Pairings
1. Go to **Monthly 1:1** in the nav
2. Select the **Year** and **Month**
3. Click **Generate Pairs** — the system ensures no pair has been matched before in the same year
4. If you need to redo it, click **Delete & Regenerate**

### Quarterly Group Sessions
1. Go to **Quarterly Groups**
2. Select the **Year** and **Quarter** (Q1–Q4)
3. Click **Generate Groups** — creates groups of ~5 people
4. Happens 4 times a year, separate from monthly 1:1s

### Year Reset
- At the end of the year, go to **History**
- Click **Reset Year** next to the year you want to clear
- This allows all pairs to be "fresh" for the new year

### Export to Excel
- Go to **History** and click **Export to Excel**
- Downloads a `.xlsx` file with all pairings organized by year
- File is also always saved at `data/coffee_chat_history.xlsx`

### Managing People
- Go to **People** to add or remove team members
- Changes only affect future pairings

---

## 🔧 Configuration

The backend runs on port **3001** and frontend on **3000** by default.

To change the backend port, set the `PORT` environment variable:
```bash
PORT=4000 npm start
```

If you change the backend port, also update the `API` constant in `frontend/src/App.js`.

---

## 📊 Data Storage

All pairing data is stored locally in `data/pairings.json`. This file is created automatically on first run. Back it up periodically to avoid losing your history.

---

## 👥 Default Team Members

The app comes pre-loaded with your 20 team members:
Huda Khatoon, Shalva Anuashvili, Emily Richards, Smruthi Raj Mohan, Rohan Swaby, David Hinton, Kara Vohra, Brielle Kolf, Ava Harnick, Shweta Mayekar, Connie He, Matt Epstein, Daniel Rosini, Archna Saxena, Dave Roglieri, Michael Saenz, Albert Chen, Hennah Nazari, Romit Bhatia, Rajkamal Singh

---

## 🛠️ Troubleshooting

**"Cannot connect to backend" error:**
- Make sure the backend is running (`npm start` in the `backend` folder)
- Check that port 3001 is not in use

**Frontend won't start:**
- Delete `frontend/node_modules` and run `npm install` again
- Make sure you're using Node.js v16+

**Pairs keep repeating:**
- This can happen when all possible combinations are exhausted (with 20 people there are 190 possible pairs, and each month uses 10)
- After ~19 months, the system may reuse some pairs — this is mathematically unavoidable

---

## 📄 License

MIT — Free to use and modify for your team.
