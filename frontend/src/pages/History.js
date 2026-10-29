import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Pairings.css';

export default function History({ data, refreshData, API }) {
  const [expandedYears, setExpandedYears] = useState({});
  const toggle = (year) => setExpandedYears(p => ({ ...p, [year]: !p[year] }));
  const years = Object.keys(data?.history || {}).sort((a, b) => b - a);

  const resetYear = async (year) => {
    if (!window.confirm(`Reset ALL pairings for ${year}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/reset/${year}`);
      toast.success(`Year ${year} reset — fresh start!`);
      refreshData();
    } catch (e) {
      toast.error('Failed to reset year');
    }
  };

  const exportExcel = () => {
    const link = document.createElement('a');
    link.href = `${API}/export`;
    link.download = 'coffee_chat_history.xlsx';
    link.click();
    toast.success('📊 Excel file downloading!');
  };

  return (
    <div className="history-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">📅 Full History</h1>
          <p className="page-subtitle">All past pairings organized by year. Reset at year-end to start fresh.</p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={exportExcel}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ background: 'linear-gradient(135deg, #059669, #0D9488)', alignSelf: 'flex-start' }}
        >
          📊 Export Excel
        </motion.button>
      </div>

      {years.length === 0 ? (
        <motion.div className="card empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="icon">📅</span>
          <p>No history yet</p>
          <span>Generate some pairings first to build your history</span>
        </motion.div>
      ) : (
        years.map((year, yi) => {
          const yearData = data.history[year];
          const isOpen = expandedYears[year] !== false;
          const monthCount = Object.keys(yearData.monthly || {}).length;
          const quarterCount = Object.keys(yearData.quarterly || {}).length;

          return (
            <motion.div
              key={year}
              className="history-year-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: yi * 0.08 }}
            >
              <div
                className="year-header"
                onClick={() => toggle(year)}
              >
                <h2 className="year-title">{year}</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  {monthCount > 0 && <span className="badge badge-primary">☕ {monthCount} months</span>}
                  {quarterCount > 0 && <span className="badge badge-teal">👥 {quarterCount} quarters</span>}
                </div>
                <span className={`year-toggle ${isOpen ? 'open' : ''}`}>▼</span>
                <motion.button
                  className="btn btn-danger"
                  style={{ marginLeft: 'auto', fontSize: 11, padding: '5px 12px' }}
                  onClick={e => { e.stopPropagation(); resetYear(year); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reset Year
                </motion.button>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    {monthCount > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div className="section-label">Monthly 1:1 Pairs</div>
                        <div className="history-month-grid">
                          {Object.entries(yearData.monthly || {}).map(([month, pairs], mi) => (
                            <motion.div
                              key={month}
                              className="history-month-card"
                              initial={{ opacity: 0, scale: 0.93 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: mi * 0.04 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="history-month-title">
                                <span>{month}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{pairs.length}p</span>
                              </div>
                              {pairs.map((pair, j) => (
                                <div key={j} className="history-pair">
                                  {pair[0].split(' ')[0]}<span>☕</span>{pair[1].split(' ')[0]}
                                  {pair[2] && <><span>+</span>{pair[2].split(' ')[0]}</>}
                                </div>
                              ))}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {quarterCount > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div className="section-label">Quarterly Groups</div>
                        <div className="history-month-grid">
                          {Object.entries(yearData.quarterly || {}).map(([quarter, groups], qi) => (
                            <motion.div
                              key={quarter}
                              className="history-month-card"
                              style={{ borderColor: 'rgba(13,148,136,0.3)' }}
                              initial={{ opacity: 0, scale: 0.93 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: qi * 0.05 }}
                            >
                              <div className="history-month-title" style={{ color: '#2DD4BF' }}>
                                <span>{quarter.split(' ')[0]}</span>
                                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{groups.length}g</span>
                              </div>
                              {groups.map((group, j) => (
                                <div key={j} className="history-pair" style={{ flexWrap: 'wrap', lineHeight: 1.8 }}>
                                  <span style={{ color: '#0D9488' }}>G{j+1}:</span>
                                  {group.map(p => p.split(' ')[0]).join(' · ')}
                                </div>
                              ))}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="divider" />
            </motion.div>
          );
        })
      )}
    </div>
  );
}
