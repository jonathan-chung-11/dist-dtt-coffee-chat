import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import Dashboard from './pages/Dashboard';
import MonthlyPairings from './pages/MonthlyPairings';
import QuarterlyGroups from './pages/QuarterlyGroups';
import History from './pages/History';
import PeopleManager from './pages/PeopleManager';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import './App.css';

const API = 'http://localhost:3001/api';

function AppInner() {
  const [activePage, setActivePage] = useState('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Password lives ONLY here in memory — never written to disk or localStorage
  const [sessionPassword, setSessionPassword] = useState('');
  const { particlesOn, theme } = useTheme();
  const cursorRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/data`);
      setData(res.data);
    } catch (e) { console.error('Failed to fetch data:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  const pages = { dashboard: Dashboard, monthly: MonthlyPairings, quarterly: QuarterlyGroups, history: History, people: PeopleManager, settings: Settings };
  const PageComponent = pages[activePage] || Dashboard;
  const particle = theme['--particle'] || '☕';

  return (
    <div className="app">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'var(--bg-card)', color: 'var(--text-primary)',
          border: '1px solid var(--border-color)', fontFamily: "'Sora', sans-serif",
          fontSize: '13px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        },
        success: { iconTheme: { primary: 'var(--accent-1)', secondary: 'var(--bg-card)' } },
        duration: 3000,
      }} />

      <div className="cursor-glow" ref={cursorRef} />

      {particlesOn && (
        <div className="particle-layer">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${i * 8.5}%`,
              fontSize: `${10 + (i % 4) * 4}px`,
              animationDuration: `${10 + i * 1.5}s`,
              animationDelay: `${i * 0.8}s`,
            }}>
              {particle}
            </div>
          ))}
        </div>
      )}

      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {loading ? <LoadingScreen /> : <PageComponent data={data} refreshData={fetchData} API={API} setActivePage={setActivePage} sessionPassword={sessionPassword} setSessionPassword={setSessionPassword} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-orbs">
        <div className="loading-orb" />
        <div className="loading-orb" />
        <div className="loading-orb" />
      </div>
      <p className="loading-text">Brewing your pairings...</p>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
