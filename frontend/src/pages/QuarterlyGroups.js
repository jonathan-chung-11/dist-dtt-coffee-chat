import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import './Pairings.css';

const QUARTERS = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];

export default function QuarterlyGroups({ data, refreshData, API }) {
  const currentYear = new Date().getFullYear();
  const currentQ = Math.floor(new Date().getMonth() / 3);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(QUARTERS[currentQ]);
  const [generating, setGenerating] = useState(false);

  // Email composer state
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('Quarterly Coffee Chat Circle ☕');
  const [verifyMode, setVerifyMode] = useState(false);
  const [gifUrl, setGifUrl] = useState('');
  const composerRef = useRef(null);

  const yearData = data?.history?.[selectedYear] || {};
  const currentGroups = yearData.quarterly?.[selectedQuarter] || null;
  const years = [];
  for (let y = currentYear - 2; y <= currentYear + 1; y++) years.push(y);

  // Normalize people to objects
  const people = (data?.people || []).map(p => typeof p === 'string' ? { name: p, email: '' } : p);

  // Load email settings on mount
  useEffect(() => {
    axios.get(`${API}/settings`).then(res => {
      setEmailTemplate(res.data.groupEmailTemplate || '');
      setEmailSubject(res.data.groupEmailSubject || 'Quarterly Coffee Chat Circle ☕');
      setGifUrl(res.data.gifUrl || '');
    }).catch(() => {});
  }, [API]);

  // Close email composer when quarter/year changes
  useEffect(() => {
    setShowEmailComposer(false);
    setVerifyMode(false);
  }, [selectedQuarter, selectedYear]);

  // The composer renders below the groups grid (off-screen on long pages) — scroll it into
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

  const buildGroupEmail = (group, template) => {
    let body = template;
    // Replace Name1, Name2, etc. with actual names
    group.forEach((name, idx) => {
      body = body.replace(new RegExp(`Name${idx + 1}`, 'g'), name);
    });
    return body;
  };

  const buildEmailPayloads = () => {
    if (!currentGroups) return [];
    return currentGroups.map((group, i) => {
      const emails = group.map(getEmail).filter(Boolean);
      const allEmails = group.map(getEmail);
      const body = buildGroupEmail(group, emailTemplate);
      const label = `Group ${i + 1}: ${group.join(', ')}`;
      const subject = emailSubject;
      return { group, emails, allEmails, body, label, subject, index: i };
    });
  };

  const emailPayloads = buildEmailPayloads();
  const missingCount = emailPayloads.filter(ep => ep.allEmails.some(e => !e)).length;

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(`${API}/generate/quarterly`, { year: selectedYear, quarter: selectedQuarter });
      if (res.data.success) {
        toast.success(`🎉 ${res.data.groups.length} groups created!`);
        refreshData();
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.error('Failed to generate groups');
    } finally {
      setGenerating(false);
    }
  };

  const deleteGroups = async () => {
    if (!window.confirm(`Delete groups for ${selectedQuarter} ${selectedYear}?`)) return;
    try {
      await axios.delete(`${API}/pairings/quarterly/${selectedYear}/${encodeURIComponent(selectedQuarter)}`);
      toast.success('Groups cleared');
      setShowEmailComposer(false);
      setVerifyMode(false);
      refreshData();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const saveTemplateToSettings = async () => {
    try {
      await axios.put(`${API}/settings`, { groupEmailTemplate: emailTemplate, groupEmailSubject: emailSubject });
      toast.success('Group template saved as default');
    } catch {
      toast.error('Failed to save template');
    }
  };

  // Build the Outlook web compose deeplink for a group (To + Subject + plain-text body).
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

  const groupColors = ['#0D9488', '#7C3AED', '#D97706', '#DB2777'];

  return (
    <div className="quarterly-page">
      <div className="page-header">
        <h1 className="page-title">👥 Quarterly Groups</h1>
        <p className="page-subtitle">Groups of 5 for quarterly coffee circles — a richer conversation format.</p>
      </div>

      <div className="controls-bar card">
        <div className="controls-left">
          <div className="control-group">
            <label>Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label>Quarter</label>
            <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
              {QUARTERS.map((q) => (
                <option key={q} value={q}>{q} {yearData.quarterly?.[q] ? '✓' : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="controls-right">
          {currentGroups && (
            <>
              <motion.button
                className="btn btn-secondary"
                onClick={() => { setShowEmailComposer(true); setVerifyMode(false); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                📧 Email Groups
              </motion.button>
              <motion.button className="btn btn-danger" onClick={deleteGroups} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                🗑 Delete & Redo
              </motion.button>
            </>
          )}
          <motion.button
            className="btn btn-primary"
            onClick={generate}
            disabled={generating || !!currentGroups}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ background: 'linear-gradient(135deg, #0D9488, #059669)' }}
          >
            {generating ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⚙️</motion.span>
            ) : '✨'}
            {generating ? ' Forming groups...' : ' Generate Groups'}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {currentGroups ? (
          <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pairs-header">
              <div className="section-label">{selectedQuarter} {selectedYear} — {currentGroups.length} groups</div>
              <span className="badge badge-teal">✓ Ready</span>
            </div>
            <motion.div
              className="quarterly-grid"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              {currentGroups.map((group, i) => {
                const color = groupColors[i % groupColors.length];
                return (
                  <motion.div
                    key={i}
                    className="group-card"
                    style={{
                      background: `linear-gradient(135deg, ${color}08, var(--bg-card))`,
                      borderColor: `${color}22`,
                    }}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.93 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 180, damping: 18 } }
                    }}
                    whileHover={{ y: -5, borderColor: `${color}55` }}
                  >
                    <span className="group-number" style={{ color, background: `${color}15` }}>Group {i + 1}</span>
                    <div className="group-title" style={{ color }}>
                      🫂 Coffee Circle {i + 1}
                    </div>
                    <div className="group-members">
                      {group.map((person, j) => (
                        <motion.div
                          key={j}
                          className="group-member"
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.07 }}
                          whileHover={{ x: 4 }}
                        >
                          <Avatar name={person} size={34} />
                          <div style={{ flex: 1 }}>
                            <span className="group-member-name">{person}</span>
                            {getEmail(person) && (
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                                {getEmail(person)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div style={{
                      position: 'absolute', bottom: -20, right: -20,
                      width: 80, height: 80, borderRadius: '50%',
                      background: `radial-gradient(circle, ${color}15, transparent)`,
                      pointerEvents: 'none',
                    }} />
                  </motion.div>
                );
              })}
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
                      📧 Group Email Composer — {selectedQuarter} {selectedYear}
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
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div className="section-label">Group Email Template</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Use <code style={{ background: 'rgba(var(--glow),0.1)', padding: '1px 5px', borderRadius: 4 }}>Name1</code>, <code style={{ background: 'rgba(var(--glow),0.1)', padding: '1px 5px', borderRadius: 4 }}>Name2</code>, etc. as placeholders
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
                          <div style={{ marginTop: 8 }}>
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
                        <div className="section-label" style={{ marginBottom: 12 }}>Groups & Recipients</div>
                        {missingCount > 0 && (
                          <div style={{
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#F59E0B', marginBottom: 12,
                          }}>
                            ⚠️ {missingCount} group(s) have members with missing emails.
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                          {emailPayloads.map((ep, i) => {
                            const allHaveEmail = ep.group.every(n => getEmail(n));
                            return (
                              <div
                                key={i}
                                style={{
                                  padding: '8px 12px', borderRadius: 8,
                                  border: `1px solid ${allHaveEmail ? 'rgba(var(--glow),0.2)' : 'rgba(245,158,11,0.3)'}`,
                                  background: allHaveEmail ? 'rgba(var(--glow),0.04)' : 'rgba(245,158,11,0.05)',
                                }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                  {allHaveEmail ? '✅' : '⚠️'} Group {i + 1}
                                </div>
                                {ep.group.map((name, j) => (
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
                          style={{ marginTop: 16, width: '100%', background: 'linear-gradient(135deg, #0D9488, #059669)' }}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                            📨 Open in Outlook — {selectedQuarter} {selectedYear}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            {emailPayloads.filter(ep => ep.emails.length > 0).length} groups ready — open in a new Chrome window, review, and send each
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
                            style={{ fontSize: 12, background: 'linear-gradient(135deg, #0D9488, #059669)' }}
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

                      {/* Tip box */}
                      <div style={{
                        background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.3)',
                        borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#0D9488',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span style={{ fontSize: 15 }}>💡</span>
                        <span>
                          Each <strong>Open in Outlook</strong> opens a new Chrome window using your company Outlook on the web — recipients, subject, and message are pre-filled.
                          {gifUrl ? <> Click in the body and press <strong>Cmd+V</strong> to drop in the GIF,</> : ' '} review, and hit Send.
                        </span>
                      </div>

                      {/* Subject */}
                      <div style={{ background: 'rgba(var(--glow),0.06)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subject: </span>
                        <span style={{ color: 'var(--text-primary)' }}>{emailSubject}</span>
                      </div>

                      {/* Group-by-group breakdown */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                        {emailPayloads.map((ep, i) => {
                          const canSend = ep.emails.length > 0;
                          const mailtoUrl = canSend
                            ? `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(ep.emails.join(';'))}&subject=${encodeURIComponent(ep.subject)}&body=${encodeURIComponent(ep.body)}`
                            : null;
                          return (
                            <div
                              key={i}
                              style={{
                                border: `1px solid ${canSend ? 'rgba(var(--glow),0.2)' : 'rgba(245,158,11,0.3)'}`,
                                borderRadius: 10,
                                overflow: 'hidden',
                              }}
                            >
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '10px 14px',
                                background: canSend ? 'rgba(var(--glow),0.06)' : 'rgba(245,158,11,0.06)',
                                flexWrap: 'wrap', gap: 8,
                              }}>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                    {canSend ? '✅' : '⚠️'} Group {i + 1}
                                  </div>
                                  <div style={{ fontSize: 11, color: canSend ? 'var(--accent-1)' : '#F59E0B', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
                                    {canSend ? ep.emails.join(', ') : 'some members missing emails'}
                                  </div>
                                </div>
                                {canSend && (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <motion.button
                                      className="btn btn-secondary"
                                      onClick={() => {
                                        navigator.clipboard.writeText(ep.body);
                                        toast.success(`Group ${i + 1} body copied!`);
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      style={{ fontSize: 11, padding: '5px 10px' }}
                                    >
                                      📋 Copy
                                    </motion.button>
                                    <motion.button
                                      className="btn btn-primary"
                                      onClick={async () => {
                                        if (gifUrl) await copyGifToClipboard();
                                        const ok = await openInChrome([mailtoUrl]);
                                        if (ok && gifUrl) toast.success('Draft opened — press Cmd+V in the body to add the GIF');
                                      }}
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      style={{ fontSize: 11, padding: '5px 12px', background: 'linear-gradient(135deg, #0D9488, #059669)' }}
                                      title="Open in a new Chrome window"
                                    >
                                      📨 Open in Outlook
                                    </motion.button>
                                  </div>
                                )}
                              </div>
                              {canSend && (
                                <pre style={{
                                  margin: 0, padding: '12px 14px',
                                  fontSize: 11, color: 'var(--text-secondary)',
                                  fontFamily: "'DM Mono', monospace", lineHeight: 1.6,
                                  background: 'var(--bg-secondary)',
                                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                  maxHeight: 160, overflowY: 'auto',
                                }}>
                                  {ep.body}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Back button */}
                      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
                        <motion.button
                          className="btn btn-secondary"
                          onClick={() => setVerifyMode(false)}
                          whileHover={{ scale: 1.03 }}
                        >
                          ← Back to Edit Template
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="empty" className="card empty-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <span className="icon">👥</span>
            <p>No groups for {selectedQuarter} {selectedYear}</p>
            <span>Generate groups of 5 for this quarter's coffee circles</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
