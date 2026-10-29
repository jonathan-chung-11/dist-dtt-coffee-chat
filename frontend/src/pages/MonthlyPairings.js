import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import './Pairings.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MonthlyPairings({ data, refreshData, API }) {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[currentMonthIdx]);
  const [generating, setGenerating] = useState(false);
  const [justGenerated, setJustGenerated] = useState(false);

  // Email composer state
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('Coffee Chat Time! ☕');
  const [verifyMode, setVerifyMode] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const composerRef = useRef(null);

  const yearData = data?.history?.[selectedYear] || {};
  const currentPairs = yearData.monthly?.[selectedMonth] || null;
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);

  const usedPairsCount = Object.values(yearData.monthly || {}).reduce((sum, pairs) => sum + pairs.length, 0);
  const totalPossible = data?.people ? (data.people.length * (data.people.length - 1)) / 2 : 0;

  // Normalize people to objects
  const people = (data?.people || []).map(p => typeof p === 'string' ? { name: p, email: '' } : p);

  // Load email settings on mount
  useEffect(() => {
    axios.get(`${API}/settings`).then(res => {
      setEmailTemplate(res.data.emailTemplate || '');
      setEmailSubject(res.data.emailSubject || 'Coffee Chat Time! ☕');
      setGifUrl(res.data.gifUrl || '');
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, [API]);

  // Close email composer when month/year changes
  useEffect(() => {
    setShowEmailComposer(false);
    setVerifyMode(false);
  }, [selectedMonth, selectedYear]);

  // The composer renders below the pairs grid (off-screen on long pages) — scroll it into
  // view when it opens or when switching between compose/verify so it's not missed.
  useEffect(() => {
    if (showEmailComposer && composerRef.current) {
      composerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showEmailComposer, verifyMode]);

  const getEmail = (name) => {
    const person = people.find(p => p.name === name);
    return person?.email || '';
  };

  const buildPairEmail = (pair, template) => {
    const name1 = pair[0];
    const name2 = pair[1];
    let body = template
      .replace(/Name1/g, name1)
      .replace(/Name2/g, name2);
    // Handle triples: add name3 at greeting
    if (pair[2]) {
      body = body.replace(new RegExp(`Hi ${name1} and ${name2},`), `Hi ${name1}, ${name2}, and ${pair[2]},`);
    }
    return body;
  };

  // Build email payloads for all pairs
  const buildEmailPayloads = () => {
    if (!currentPairs) return [];
    return currentPairs.map((pair, i) => {
      const emails = pair.map(getEmail).filter(Boolean);
      const body = buildPairEmail(pair, emailTemplate);
      const label = pair.join(' & ');
      const subject = `${emailSubject}`;
      return { pair, emails, allEmails: pair.map(getEmail), body, label, subject, index: i };
    });
  };

  const emailPayloads = buildEmailPayloads();
  const missingEmails = emailPayloads.filter(ep => ep.allEmails.some(e => !e));
  const readyToSend = emailPayloads.filter(ep => ep.emails.length === ep.pair.length);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/generate/monthly`, { year: selectedYear, month: selectedMonth });
      if (res.data.success) {
        toast.success(`✨ ${res.data.pairs.length} fresh pairs brewed for ${selectedMonth}!`);
        setJustGenerated(true);
        setTimeout(() => setJustGenerated(false), 3000);
        refreshData();
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.error('Failed to generate pairs');
    } finally {
      setGenerating(false);
    }
  };

  const deletePairs = async () => {
    if (!window.confirm(`Delete pairs for ${selectedMonth} ${selectedYear}?`)) return;
    try {
      await axios.delete(`${API}/pairings/monthly/${selectedYear}/${selectedMonth}`);
      toast.success('Pairs cleared — ready to regenerate');
      setShowEmailComposer(false);
      setVerifyMode(false);
      refreshData();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openEmailComposer = () => {
    setShowEmailComposer(true);
    setVerifyMode(false);
  };

  const saveTemplateToSettings = async () => {
    try {
      await axios.put(`${API}/settings`, { emailTemplate, emailSubject });
      toast.success('Template saved as default');
    } catch {
      toast.error('Failed to save template');
    }
  };

  // Build the Outlook web compose deeplink for a pair (To + Subject + plain-text body).
  const buildMailtoUrl = (ep) => ep.emails.length
    ? `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(ep.emails.join(';'))}&subject=${encodeURIComponent(ep.subject)}&body=${encodeURIComponent(ep.body)}`
    : null;

  // Put the GIF on the clipboard as inline HTML referencing the PUBLIC url, so a single Cmd+V
  // embeds it in the draft. Outlook-web keeps external https image refs on paste (it strips
  // local/data-URI images), and recipients can load it. Must run first inside a click handler.
  const copyGifToClipboard = async () => {
    if (!gifUrl) return false;
    try {
      const html = `<img src="${gifUrl}" alt="coffee gif" />`;
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([gifUrl], { type: 'text/plain' }),
      })]);
      return true;
    } catch {
      return false;
    }
  };

  // Ask the backend to open these URLs in a brand-new Chrome window (one tab each).
  const openInChrome = async (urls) => {
    try {
      await axios.post(`${API}/open-in-chrome`, { urls });
      return true;
    } catch {
      toast.error('Could not open Chrome — is the backend running?');
      return false;
    }
  };

  const saveGifUrl = () => {
    axios.put(`${API}/settings`, { gifUrl })
      .then(() => { if (gifUrl) toast.success('GIF link saved ☕'); })
      .catch(() => toast.error('Failed to save GIF link'));
  };

  const clearGifUrl = () => {
    setGifUrl('');
    axios.put(`${API}/settings`, { gifUrl: '' }).catch(() => {});
    toast.success('GIF link cleared');
  };

  return (
    <div className="pairings-page">
      <div className="page-header">
        <h1 className="page-title">☕ Monthly 1:1 Pairings</h1>
        <p className="page-subtitle">Unique pairs every month — no repeats within the year.</p>
      </div>

      {/* Stats banner */}
      {Object.keys(yearData.monthly || {}).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}
        >
          {[
            { label: 'Months done', value: Object.keys(yearData.monthly || {}).length, icon: '✅' },
            { label: 'Pairs made', value: usedPairsCount, icon: '☕' },
            { label: 'Remaining combos', value: totalPossible - usedPairsCount, icon: '🔄' },
          ].map((s, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03, y: -2 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: 'rgba(var(--glow), 0.07)',
                border: '1px solid rgba(var(--glow), 0.2)',
                borderRadius: 10,
                fontSize: 13, color: 'var(--text-secondary)',
              }}
            >
              <span>{s.icon}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent-1)' }}>{s.value}</span>
              <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Controls */}
      <div className="controls-bar card">
        <div className="controls-left">
          <div className="control-group">
            <label>Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Month</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MONTHS.map(m => (
                <option key={m} value={m}>
                  {m} {yearData.monthly?.[m] ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="controls-right">
          {currentPairs && (
            <>
              <motion.button
                className="btn btn-secondary"
                onClick={openEmailComposer}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ gap: 6 }}
              >
                📧 Email Pairs
              </motion.button>
              <motion.button
                className="btn btn-danger"
                onClick={deletePairs}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                🗑 Delete & Redo
              </motion.button>
            </>
          )}
          <motion.button
            className="btn btn-primary"
            onClick={generate}
            disabled={generating || !!currentPairs}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {generating ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >⚙️</motion.span>
            ) : '✨'}
            {generating ? ' Brewing...' : ' Generate Pairs'}
          </motion.button>
        </div>
      </div>

      {/* Pairs display */}
      <AnimatePresence mode="wait">
        {currentPairs ? (
          <motion.div key={`pairs-${selectedMonth}-${selectedYear}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pairs-header">
              <div className="section-label">{selectedMonth} {selectedYear} — {currentPairs.length} pairs</div>
              <motion.span
                className="badge badge-primary"
                animate={justGenerated ? { scale: [1, 1.3, 1], boxShadow: ['0 0 0px', '0 0 20px rgba(var(--glow), 0.5)', '0 0 0px'] } : {}}
                transition={{ duration: 0.6 }}
              >
                ✓ Ready
              </motion.span>
            </div>
            <motion.div
              className="pairs-grid"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            >
              {currentPairs.map((pair, i) => (
                <motion.div
                  key={i}
                  className="pair-card-big"
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.93 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } }
                  }}
                  whileHover={{ y: -5 }}
                >
                  <div className="pair-number">#{String(i + 1).padStart(2, '0')}</div>

                  <div className="pair-person">
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <Avatar name={pair[0]} size={52} />
                    </motion.div>
                    <div className="pair-name">{pair[0]}</div>
                    {getEmail(pair[0]) && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", textAlign: 'center', maxWidth: 120, wordBreak: 'break-all' }}>
                        {getEmail(pair[0])}
                      </div>
                    )}
                  </div>

                  <div className="pair-vs">
                    <div className="pair-vs-line" />
                    <div className="pair-vs-icon">☕</div>
                    <div className="pair-vs-line" />
                  </div>

                  <div className="pair-person">
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <Avatar name={pair[1]} size={52} />
                    </motion.div>
                    <div className="pair-name">{pair[1]}</div>
                    {getEmail(pair[1]) && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", textAlign: 'center', maxWidth: 120, wordBreak: 'break-all' }}>
                        {getEmail(pair[1])}
                      </div>
                    )}
                  </div>

                  {pair[2] && (
                    <>
                      <div className="pair-vs">
                        <div className="pair-vs-line" />
                        <span style={{ fontSize: 14, color: 'var(--accent-2)' }}>+1</span>
                        <div className="pair-vs-line" />
                      </div>
                      <div className="pair-person">
                        <Avatar name={pair[2]} size={44} />
                        <div className="pair-name" style={{ fontSize: 12 }}>{pair[2]}</div>
                      </div>
                    </>
                  )}

                  <motion.div
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 16,
                      background: 'linear-gradient(135deg, rgba(var(--glow),0.05), transparent, rgba(var(--glow),0.05))',
                      pointerEvents: 'none', opacity: 0,
                    }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* ===== EMAIL COMPOSER ===== */}
            <AnimatePresence>
              {showEmailComposer && (
                <motion.div
                  ref={composerRef}
                  key="email-composer"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                  style={{ marginTop: 32, scrollMarginTop: 80 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      📧 Email Composer — {selectedMonth} {selectedYear}
                    </div>
                    <button
                      onClick={() => { setShowEmailComposer(false); setVerifyMode(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}
                    >
                      ✕
                    </button>
                  </div>

                  {!verifyMode ? (
                    /* ===== COMPOSE VIEW ===== */
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                      {/* Template editor */}
                      <div className="card" style={{ padding: 20 }}>
                        <div style={{ marginBottom: 12 }}>
                          <div className="section-label" style={{ marginBottom: 8 }}>Email Subject</div>
                          <input
                            type="text"
                            value={emailSubject}
                            onChange={e => setEmailSubject(e.target.value)}
                            style={{ width: '100%', fontSize: 13 }}
                            placeholder="Email subject..."
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div className="section-label">Email Template</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Use <code style={{ background: 'rgba(var(--glow),0.1)', padding: '1px 5px', borderRadius: 4 }}>Name1</code> and <code style={{ background: 'rgba(var(--glow),0.1)', padding: '1px 5px', borderRadius: 4 }}>Name2</code> as placeholders
                            </div>
                          </div>
                          <textarea
                            value={emailTemplate}
                            onChange={e => setEmailTemplate(e.target.value)}
                            rows={22}
                            style={{
                              width: '100%', fontSize: 12, lineHeight: 1.7,
                              fontFamily: "'DM Mono', monospace",
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 10, padding: '12px 14px',
                              color: 'var(--text-primary)',
                              resize: 'vertical',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <motion.button
                              className="btn btn-secondary"
                              onClick={saveTemplateToSettings}
                              whileHover={{ scale: 1.03 }}
                              style={{ fontSize: 11, padding: '5px 12px' }}
                            >
                              💾 Save as Default
                            </motion.button>
                          </div>
                        </div>

                        {/* GIF (public link) */}
                        <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
                          <div className="section-label" style={{ marginBottom: 8 }}>🎞️ GIF link (optional)</div>
                          <input
                            type="url"
                            value={gifUrl}
                            onChange={e => setGifUrl(e.target.value)}
                            onBlur={saveGifUrl}
                            placeholder="Paste a public GIF link ending in .gif…"
                            style={{ width: '100%', fontSize: 12, fontFamily: "'DM Mono', monospace" }}
                          />
                          {gifUrl && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                              <img
                                src={gifUrl}
                                alt="gif preview"
                                style={{ height: 80, borderRadius: 8, border: '1px solid var(--border-color)' }}
                              />
                              <button
                                onClick={clearGifUrl}
                                className="btn btn-secondary"
                                style={{ fontSize: 11, padding: '4px 10px' }}
                              >
                                🗑 Clear
                              </button>
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                            Use a <strong>direct</strong> GIF link (on Giphy/Tenor, right-click the GIF → <em>Copy Image Address</em> — it should end in <code>.gif</code>). When you open a draft, this GIF is copied to your clipboard — click in the email body and press <strong>Cmd+V</strong> to embed it. Recipients see it animated because it loads from this public link. (Classic Outlook desktop may show only the first frame.)
                          </div>
                        </div>
                      </div>

                      {/* Recipients panel */}
                      <div className="card" style={{ padding: 20 }}>
                        <div className="section-label" style={{ marginBottom: 12 }}>Recipients</div>
                        {missingEmails.length > 0 && (
                          <div style={{
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#F59E0B', marginBottom: 12,
                          }}>
                            ⚠️ {missingEmails.length} pair(s) have missing emails — go to Team Members to add them.
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                          {emailPayloads.map((ep, i) => {
                            const allHaveEmail = ep.pair.every(n => getEmail(n));
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  border: `1px solid ${allHaveEmail ? 'rgba(var(--glow),0.2)' : 'rgba(245,158,11,0.3)'}`,
                                  background: allHaveEmail ? 'rgba(var(--glow),0.04)' : 'rgba(245,158,11,0.05)',
                                }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                  {allHaveEmail ? '✅' : '⚠️'} {ep.label}
                                </div>
                                {ep.pair.map((name, j) => (
                                  <div key={j} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>•</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{name}:</span>
                                    <span style={{ fontFamily: "'DM Mono', monospace", color: getEmail(name) ? 'var(--accent-1)' : '#EF4444' }}>
                                      {getEmail(name) || 'no email'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>

                        <motion.button
                          className="btn btn-primary"
                          onClick={() => setVerifyMode(true)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          style={{ marginTop: 16, width: '100%' }}
                          disabled={emailPayloads.filter(ep => ep.emails.length > 0).length === 0}
                        >
                          🔍 Preview & Verify
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    /* ===== VERIFY VIEW ===== */
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card"
                      style={{ padding: 24 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                            🔍 Review & Send — {selectedMonth} {selectedYear}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            {emailPayloads.filter(ep => ep.emails.length > 0).length} pairs ready · open in a new Chrome window, review, and send each
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <motion.button
                            className="btn btn-primary"
                            onClick={async () => {
                              const urls = emailPayloads.filter(ep => ep.emails.length > 0).map(buildMailtoUrl);
                              if (urls.length === 0) return;
                              if (gifUrl) await copyGifToClipboard();
                              const ok = await openInChrome(urls);
                              if (ok) {
                                toast.success(gifUrl
                                  ? 'Opened all drafts in Chrome — in each tab press Cmd+V to add the GIF, then Send'
                                  : 'Opened all drafts in Chrome');
                              }
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{ fontSize: 12 }}
                          >
                            📨 Open ALL in new Chrome window
                          </motion.button>
                          <motion.button
                            className="btn btn-secondary"
                            onClick={() => setVerifyMode(false)}
                            whileHover={{ scale: 1.03 }}
                            style={{ fontSize: 12 }}
                          >
                            ← Back to Edit
                          </motion.button>
                        </div>
                      </div>

                      {/* Outlook tip */}
                      <div style={{
                        background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#60A5FA',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                        <span>
                          Each <strong>Open in Outlook</strong> opens a new Chrome window using your company Outlook on the web — To, subject, and message are pre-filled.
                          {gifUrl ? <> Click in the body and press <strong>Cmd+V</strong> to drop in the GIF,</> : ' '} review, and hit Send. No password needed.
                        </span>
                      </div>

                      {/* Subject */}
                      <div style={{ background: 'rgba(var(--glow),0.06)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subject: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{emailSubject}</span>
                      </div>

                      {/* Pair-by-pair rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
                        {emailPayloads.map((ep, i) => {
                          const canSend = ep.emails.length > 0;
                          const mailtoUrl = canSend
                            ? `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(ep.emails.join(';'))}&subject=${encodeURIComponent(ep.subject)}&body=${encodeURIComponent(ep.body)}`
                            : null;
                          return (
                            <div
                              key={i}
                              style={{
                                border: `1px solid ${canSend ? 'rgba(var(--glow),0.2)' : 'rgba(245,158,11,0.25)'}`,
                                borderRadius: 10, overflow: 'hidden',
                              }}
                            >
                              {/* Header row */}
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 14px',
                                background: canSend ? 'rgba(var(--glow),0.05)' : 'rgba(245,158,11,0.05)',
                                flexWrap: 'wrap',
                              }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
                                  {canSend ? '✅' : '⚠️'} Pair #{i + 1}: {ep.label}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", flex: 2 }}>
                                  {canSend ? ep.emails.join(' · ') : 'missing emails'}
                                </span>
                                {canSend && (
                                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <motion.button
                                      className="btn btn-secondary"
                                      onClick={() => { navigator.clipboard.writeText(ep.body); import('react-hot-toast').then(m => m.default.success('Body copied!')); }}
                                      whileHover={{ scale: 1.04 }}
                                      style={{ fontSize: 11, padding: '4px 10px' }}
                                      title="Copy email body"
                                    >
                                      📋 Copy
                                    </motion.button>
                                    <motion.button
                                      className="btn btn-primary"
                                      onClick={async () => {
                                        if (gifUrl) await copyGifToClipboard();
                                        const ok = await openInChrome([mailtoUrl]);
                                        if (ok && gifUrl) {
                                          import('react-hot-toast').then(m => m.default.success('Draft opened — press Cmd+V in the body to add the GIF'));
                                        }
                                      }}
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      style={{ fontSize: 11, padding: '4px 12px' }}
                                      title="Open in a new Chrome window"
                                    >
                                      📨 Open in Outlook
                                    </motion.button>
                                  </div>
                                )}
                              </div>

                              {/* Email body preview */}
                              {canSend && (
                                <pre style={{
                                  margin: 0, padding: '12px 14px',
                                  fontSize: 11, color: 'var(--text-secondary)',
                                  fontFamily: "'DM Mono', monospace", lineHeight: 1.6,
                                  background: 'var(--bg-secondary)',
                                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                  maxHeight: 140, overflowY: 'auto',
                                }}>
                                  {ep.body}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ paddingTop: 14, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <motion.button
                          className="btn btn-secondary"
                          onClick={() => setVerifyMode(false)}
                          whileHover={{ scale: 1.03 }}
                        >
                          ← Back to Edit Template
                        </motion.button>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Open each pair in Outlook, review, and click Send in Outlook
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="empty" className="card empty-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="icon">☕</span>
            <p>No pairs for {selectedMonth} {selectedYear}</p>
            <span>Hit "Generate Pairs" to brew this month's coffee chats!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
