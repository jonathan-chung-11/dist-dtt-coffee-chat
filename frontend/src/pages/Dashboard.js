import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Avatar from '../components/Avatar';

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };

export default function Dashboard({ data, API, setActivePage }) {
  const [stats, setStats] = useState(null);
  const [counter, setCounter] = useState({ people: 0, pairs: 0, years: 0, groups: 0 });

  useEffect(() => {
    axios.get(`${API}/stats`).then(r => {
      setStats(r.data);
      // Animate counters
      const target = { people: r.data.totalPeople, pairs: r.data.totalMonthlyPairings, years: r.data.yearsTracked, groups: r.data.totalQuarterlyGroups };
      const steps = 30;
      let step = 0;
      const interval = setInterval(() => {
        step++;
        const progress = step / steps;
        const ease = 1 - Math.pow(1 - progress, 3);
        setCounter({
          people: Math.round(target.people * ease),
          pairs: Math.round(target.pairs * ease),
          years: Math.round(target.years * ease),
          groups: Math.round(target.groups * ease),
        });
        if (step >= steps) clearInterval(interval);
      }, 30);
    });
  }, [API]);

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const yearData = data?.history?.[currentYear] || {};

  const recentPairs = [];
  if (yearData.monthly) {
    const months = Object.keys(yearData.monthly);
    const lastMonth = months[months.length - 1];
    if (lastMonth) recentPairs.push(...yearData.monthly[lastMonth].slice(0, 5).map(p => ({ pair: p, month: lastMonth })));
  }

  const statCards = [
    { label: 'Team Members', value: counter.people, icon: '👥', color: 'var(--accent-1)', action: () => setActivePage('people') },
    { label: 'Years Tracked', value: counter.years, icon: '📅', color: '#60A5FA', action: () => setActivePage('history') },
    { label: 'Total 1:1 Pairs', value: counter.pairs, icon: '☕', color: 'var(--accent-2)', action: () => setActivePage('monthly') },
    { label: 'Group Sessions', value: counter.groups, icon: '🫂', color: '#A78BFA', action: () => setActivePage('quarterly') },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <motion.div className="page-header" {...fadeUp(0)}>
        <h1 className="page-title">📊 Dashboard</h1>
        <p className="page-subtitle">Your coffee chat program at a glance — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}
        variants={stagger} initial="initial" animate="animate"
      >
        {statCards.map((s, i) => (
          <motion.div
            key={i}
            variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={s.action}
            className="card"
            style={{
              cursor: 'pointer',
              textAlign: 'center',
              padding: '28px 20px',
              background: `linear-gradient(135deg, var(--bg-card) 0%, ${s.color}08 100%)`,
              borderColor: `${s.color}22`,
            }}
          >
            {/* Animated ring */}
            <motion.div
              style={{
                width: 60, height: 60,
                borderRadius: '50%',
                background: `${s.color}18`,
                border: `2px solid ${s.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, margin: '0 auto 14px',
                boxShadow: `0 0 20px ${s.color}22`,
              }}
              animate={{ boxShadow: [`0 0 20px ${s.color}22`, `0 0 40px ${s.color}44`, `0 0 20px ${s.color}22`] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
            >
              {s.icon}
            </motion.div>
            <motion.div
              style={{ fontSize: 40, fontFamily: "'Playfair Display', serif", fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 6 }}
              key={s.value}
            >
              {s.value}
            </motion.div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>
        {/* Recent pairs */}
        <motion.div className="card" {...fadeUp(0.25)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="section-label">Most Recent Pairs</div>
            {recentPairs.length > 0 && (
              <span className="badge badge-primary">
                {Object.keys(yearData.monthly || {}).slice(-1)[0]} {currentYear}
              </span>
            )}
          </div>

          {recentPairs.length > 0 ? (
            <motion.div variants={stagger} initial="initial" animate="animate">
              {recentPairs.map((item, i) => (
                <motion.div
                  key={i}
                  variants={{ initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: i < recentPairs.length - 1 ? '1px solid rgba(var(--glow), 0.1)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Avatar name={item.pair[0]} size={38} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.pair[0]}</span>
                  </div>
                  <motion.div
                    style={{ padding: '0 16px', fontSize: 18, color: 'var(--accent-1)', opacity: 0.8 }}
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                  >
                    ☕
                  </motion.div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.pair[1]}</span>
                    <Avatar name={item.pair[1]} size={38} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="empty-state">
              <span className="icon">☕</span>
              <p>No pairings yet</p>
              <span>Generate your first month's pairs to get started!</span>
              <br /><br />
              <motion.button
                className="btn btn-primary"
                onClick={() => setActivePage('monthly')}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              >
                ✨ Generate Pairs
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team */}
          <motion.div className="card" {...fadeUp(0.3)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div className="section-label">Team</div>
              <span className="badge badge-primary">{data?.people?.length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data?.people?.map((person, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.03 * i, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px 4px 5px',
                    background: 'rgba(var(--glow), 0.08)',
                    border: '1px solid rgba(var(--glow), 0.15)',
                    borderRadius: 20,
                    fontSize: 12, color: 'var(--text-secondary)',
                    cursor: 'default',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <Avatar name={typeof person === 'string' ? person : person.name} size={22} />
                  <span>{(typeof person === 'string' ? person : person.name).split(' ')[0]}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Month progress */}
          <motion.div className="card" {...fadeUp(0.35)}>
            <div className="section-label">{currentYear} Monthly Progress</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {MONTHS_SHORT.map((m, i) => {
                const done = !!yearData.monthly?.[MONTHS_FULL[i]];
                const isCurrent = i === currentMonthIdx;
                return (
                  <motion.div
                    key={m}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.03 * i }}
                    whileHover={{ scale: 1.1 }}
                    style={{
                      position: 'relative',
                      padding: '9px 4px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 8,
                      background: done
                        ? 'rgba(var(--glow), 0.15)'
                        : isCurrent
                        ? 'rgba(var(--glow), 0.07)'
                        : 'rgba(var(--glow), 0.03)',
                      border: done
                        ? '1px solid rgba(var(--glow), 0.4)'
                        : isCurrent
                        ? '1px dashed rgba(var(--glow), 0.3)'
                        : '1px solid var(--border-color)',
                      color: done ? 'var(--accent-1)' : isCurrent ? 'var(--text-secondary)' : 'var(--text-muted)',
                      cursor: 'default',
                      animation: done ? 'glowPulse 3s ease-in-out infinite' : 'none',
                      animationDelay: `${i * 0.2}s`,
                    }}
                  >
                    {m}
                    {done && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                          position: 'absolute', top: -5, right: -5,
                          background: 'var(--accent-1)', color: 'var(--bg-primary)',
                          width: 14, height: 14, borderRadius: '50%',
                          fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 900,
                        }}
                      >✓</motion.div>
                    )}
                    {isCurrent && !done && (
                      <div style={{
                        position: 'absolute', top: -4, right: -4,
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--accent-2)',
                        animation: 'glowPulse 1.5s ease-in-out infinite',
                      }} />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(var(--glow), 0.2); }
          50% { box-shadow: 0 0 20px rgba(var(--glow), 0.5); }
        }
        @media (max-width: 900px) {
          .stats-responsive { grid-template-columns: repeat(2, 1fr) !important; }
          .main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
