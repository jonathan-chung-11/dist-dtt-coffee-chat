import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTheme, themes } from '../utils/ThemeContext';
import './Settings.css';

const AnimLevels = [
  { id: 'high', label: 'Full Animations', desc: 'Everything moves — particles, glows, spring physics', icon: '🚀' },
  { id: 'medium', label: 'Balanced', desc: 'Smooth transitions, no floating particles', icon: '⚡' },
  { id: 'low', label: 'Minimal', desc: 'Subtle fades only — best for low-end devices', icon: '🌱' },
];

const fontOptions = [
  { id: 'sora', label: 'Sora', desc: 'Modern geometric (default)', family: "'Sora', sans-serif" },
  { id: 'inter', label: 'Inter', desc: 'Clean & readable', family: "'Inter', sans-serif" },
  { id: 'dm', label: 'DM Sans', desc: 'Friendly & approachable', family: "'DM Sans', sans-serif" },
  { id: 'mono', label: 'DM Mono', desc: 'Technical monospace vibe', family: "'DM Mono', monospace" },
];

const accentPresets = [
  '#C8956C', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F43F5E', '#FFFFFF', '#A78BFA',
];

const API = 'http://localhost:3001/api';

export default function Settings() {
  const { themeName, theme, animLevel, particlesOn, compactMode, accentColor,
    saveTheme, saveAnim, saveParticles, saveCompact, saveAccent } = useTheme();

  const [customAccent, setCustomAccent] = useState(accentColor || '#C8956C');
  const [selectedFont, setSelectedFont] = useState('sora');
  const [previewTheme, setPreviewTheme] = useState(null);

  const [emailSettings, setEmailSettings] = useState({
    senderName: '',
    emailSubject: 'Coffee Chat Time! ☕',
  });
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    axios.get(`${API}/settings`).then(res => {
      setEmailSettings(prev => ({
        ...prev,
        senderName: res.data.senderName || '',
        emailSubject: res.data.emailSubject || 'Coffee Chat Time! ☕',
      }));
    }).catch(() => {});
  }, []);

  const saveEmailSettings = async () => {
    setSavingEmail(true);
    try {
      await axios.put(`${API}/settings`, emailSettings);
      toast.success('Settings saved!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSavingEmail(false);
    }
  };

  const applyAccent = (color) => {
    setCustomAccent(color);
    saveAccent(color);
    toast.success('Accent color updated!');
  };

  const applyFont = (font) => {
    setSelectedFont(font.id);
    document.documentElement.style.setProperty('--font-body', font.family);
    document.body.style.fontFamily = font.family;
    toast.success(`Font changed to ${font.label}`);
  };

  const resetAll = () => {
    if (!window.confirm('Reset all settings to defaults?')) return;
    saveTheme('coffee');
    saveAnim('high');
    saveParticles(true);
    saveCompact(false);
    saveAccent('');
    toast.success('Settings reset to defaults ☕');
  };

  const displayedTheme = previewTheme ? themes[previewTheme] : theme;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">Customize your Coffee Chat experience — themes, animations, colors & more.</p>
      </div>

      {/* === THEME SELECTOR === */}
      <SettingsSection title="🎨 Theme" subtitle="Choose your visual vibe">
        <div className="theme-grid">
          {Object.entries(themes).map(([key, t]) => {
            const isActive = themeName === key;
            const isPreviewing = previewTheme === key;
            return (
              <motion.div
                key={key}
                className={`theme-card ${isActive ? 'active' : ''}`}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setPreviewTheme(key)}
                onHoverEnd={() => setPreviewTheme(null)}
                onClick={() => { saveTheme(key); setPreviewTheme(null); toast.success(`${t.name} theme applied!`); }}
                style={{
                  borderColor: isActive ? t['--accent-1'] : 'var(--border-color)',
                  boxShadow: isActive ? `0 0 24px ${t['--accent-1']}44` : 'none',
                }}
              >
                {/* Mini preview */}
                <div className="theme-preview" style={{ background: t['--bg-primary'] }}>
                  <div style={{ width: '60%', height: 8, borderRadius: 4, background: t['--accent-1'], marginBottom: 5 }} />
                  <div style={{ width: '40%', height: 5, borderRadius: 3, background: t['--accent-2'], opacity: 0.7, marginBottom: 5 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ flex: 1, height: 16, borderRadius: 4, background: t['--bg-card'], border: `1px solid ${t['--border-color']}` }}>
                        <div style={{ height: 4, margin: '4px 4px 0', borderRadius: 2, background: t['--accent-1'], opacity: 0.6 }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                  <span style={{ fontSize: 20 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? t['--accent-1'] : 'var(--text-primary)' }}>
                      {t.name}
                    </div>
                    {isActive && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Active</div>}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="theme-check"
                      style={{
                        marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%',
                        background: t['--accent-1'], display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 900,
                      }}
                    >✓</motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </SettingsSection>

      {/* === ACCENT COLOR === */}
      <SettingsSection title="🌈 Accent Color" subtitle="Override the theme's primary accent">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {accentPresets.map(color => (
            <motion.button
              key={color}
              onClick={() => applyAccent(color)}
              whileHover={{ scale: 1.2, y: -3 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                background: color,
                border: customAccent === color ? `3px solid white` : '2px solid transparent',
                cursor: 'pointer',
                boxShadow: customAccent === color ? `0 0 16px ${color}88` : `0 2px 8px ${color}44`,
                transition: 'box-shadow 0.2s',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Custom:</label>
          <input
            type="color"
            value={customAccent}
            onChange={e => setCustomAccent(e.target.value)}
            style={{ width: 44, height: 32, padding: 2, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
          />
          <motion.button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 14px' }}
            onClick={() => applyAccent(customAccent)}
            whileHover={{ scale: 1.04 }}
          >
            Apply
          </motion.button>
          <motion.button
            className="btn btn-secondary"
            style={{ fontSize: 12, padding: '6px 14px' }}
            onClick={() => { saveAccent(''); setCustomAccent(theme['--accent-1']); toast.success('Accent reset to theme default'); }}
            whileHover={{ scale: 1.04 }}
          >
            Reset
          </motion.button>
        </div>
      </SettingsSection>

      {/* === ANIMATIONS === */}
      <SettingsSection title="✨ Animation Level" subtitle="Balance between delight and performance">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {AnimLevels.map(level => (
            <motion.div
              key={level.id}
              onClick={() => { saveAnim(level.id); toast.success(`Animation: ${level.label}`); }}
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              style={{
                flex: 1,
                minWidth: 160,
                padding: '16px',
                borderRadius: 12,
                border: `1px solid ${animLevel === level.id ? 'rgba(var(--glow), 0.5)' : 'var(--border-color)'}`,
                background: animLevel === level.id ? 'rgba(var(--glow), 0.1)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{level.icon}</div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: animLevel === level.id ? 'var(--accent-1)' : 'var(--text-primary)',
                marginBottom: 4,
              }}>
                {level.label}
                {animLevel === level.id && ' ✓'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{level.desc}</div>
            </motion.div>
          ))}
        </div>
      </SettingsSection>

      {/* === TOGGLES === */}
      <SettingsSection title="🎛️ Display Options" subtitle="Fine-tune the interface">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Toggle
            label="Floating Particles"
            desc="Animated particles drifting in the background"
            value={particlesOn}
            onChange={(v) => { saveParticles(v); toast.success(v ? 'Particles ON ✨' : 'Particles OFF'); }}
          />
          <Toggle
            label="Compact Mode"
            desc="Reduced padding and font sizes for more content"
            value={compactMode}
            onChange={(v) => { saveCompact(v); toast.success(v ? 'Compact mode ON' : 'Compact mode OFF'); }}
          />
        </div>
      </SettingsSection>

      {/* === FONT === */}
      <SettingsSection title="🔤 Font Style" subtitle="Change the body typeface">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {fontOptions.map(font => (
            <motion.div
              key={font.id}
              onClick={() => applyFont(font)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: `1px solid ${selectedFont === font.id ? 'rgba(var(--glow), 0.5)' : 'var(--border-color)'}`,
                background: selectedFont === font.id ? 'rgba(var(--glow), 0.08)' : 'var(--bg-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontFamily: font.family, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                {font.label} Aa
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{font.desc}</div>
            </motion.div>
          ))}
        </div>
      </SettingsSection>

      {/* === EMAIL SETTINGS === */}
      <SettingsSection title="📧 Email Defaults" subtitle="These pre-fill the email templates on the Pairings pages. Clicking a pair opens a draft in a new Chrome window using your company Outlook on the web — no password needed.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Your Name (used in templates)
              </div>
              <input
                type="text"
                placeholder="e.g. Raj"
                value={emailSettings.senderName}
                onChange={e => setEmailSettings(s => ({ ...s, senderName: e.target.value }))}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                Default Email Subject
              </div>
              <input
                type="text"
                value={emailSettings.emailSubject}
                onChange={e => setEmailSettings(s => ({ ...s, emailSubject: e.target.value }))}
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{
            background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.25)',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#0D9488',
          }}>
            💡 Clicking <strong>"Open in Outlook"</strong> on a Pairings page opens a pre-filled draft in a new <strong>Chrome window</strong> using your company Outlook on the web — review and Send manually. You can add a public GIF link on the Pairings pages: it's copied to your clipboard so you paste it into the draft (Cmd+V) and recipients see it animated. No SMTP credentials needed.
          </div>

          <motion.button
            className="btn btn-primary"
            onClick={saveEmailSettings}
            disabled={savingEmail}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{ alignSelf: 'flex-start' }}
          >
            {savingEmail ? '⚙️ Saving...' : '💾 Save'}
          </motion.button>
        </div>
      </SettingsSection>

      {/* === RESET === */}
      <motion.div
        style={{ textAlign: 'center', paddingTop: 8 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          className="btn btn-danger"
          onClick={resetAll}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{ fontSize: 13 }}
        >
          🔄 Reset All Settings to Defaults
        </motion.button>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          This won't affect your pairing data — only visual settings.
        </div>
      </motion.div>
    </div>
  );
}

function SettingsSection({ title, subtitle, children }) {
  return (
    <motion.div
      className="card"
      style={{ marginBottom: 20 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ boxShadow: '0 8px 40px rgba(var(--glow), 0.15)' }}
    >
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
      </div>
      {children}
    </motion.div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <motion.button
        onClick={() => onChange(!value)}
        whileTap={{ scale: 0.9 }}
        style={{
          width: 52,
          height: 28,
          borderRadius: 14,
          background: value ? 'var(--accent-1)' : 'var(--bg-secondary)',
          border: `1px solid ${value ? 'var(--accent-1)' : 'var(--border-color)'}`,
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.3s, border-color 0.3s',
          flexShrink: 0,
          boxShadow: value ? '0 0 16px rgba(var(--glow), 0.4)' : 'none',
        }}
      >
        <motion.div
          animate={{ x: value ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'absolute',
            top: 3, left: 0,
            width: 20, height: 20,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        />
      </motion.button>
    </div>
  );
}
